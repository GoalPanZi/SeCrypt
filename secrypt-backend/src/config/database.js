const { Sequelize } = require('sequelize');
const { initializeModels, syncModels } = require('../models/index');

// Sequelize 인스턴스
let sequelize = null;
let models = null;

// 데이터베이스 설정
const getDatabaseConfig = () => {
  const config = {
    // 기본 연결 설정
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    database: process.env.DB_NAME || 'secrypt_db',
    username: process.env.DB_USERNAME || 'secrypt_user',
    password: process.env.DB_PASSWORD,
    
    // 연결 풀 설정
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    },
    
    // 로깅 설정
    logging: process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true' 
      ? (sql, timing) => console.log('📝 SQL:', sql.replace(/\s+/g, ' '), `(${timing}ms)`)
      : false,
    
    // 타임존 설정
    timezone: '+09:00',
    
    // SSL 설정 (프로덕션)
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      
      // 연결 타임아웃
      connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      
      // PostgreSQL 특정 설정
      ...(process.env.DB_DIALECT === 'postgres' && {
        application_name: 'SeCrypt-Backend',
        statement_timeout: 30000,
      })
    },
    
    // 기타 옵션
    define: {
      timestamps: true,
      underscored: false,
      paranoid: false,
      freezeTableName: true,
    },
    
    // 쿼리 재시도 설정
    retry: {
      max: 3,
      timeout: 5000,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
    },
  };

  // 개발 환경에서 SQLite 지원
  if (process.env.NODE_ENV === 'development' && process.env.DB_DIALECT === 'sqlite') {
    config.storage = process.env.DB_SQLITE_PATH || './secrypt_dev.sqlite';
    config.dialectOptions = {};
  }

  return config;
};

// 데이터베이스 연결 및 동기화
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to database with Sequelize...');
    
    const config = getDatabaseConfig();
    sequelize = new Sequelize(config);
    
    // 연결 테스트
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    
    // 모델 초기화
    models = initializeModels(sequelize);
    
    // 데이터베이스 동기화 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const forceSync = process.env.DB_FORCE_SYNC === 'true';
      const alterSync = process.env.DB_ALTER_SYNC === 'true';
      
      if (forceSync) {
        console.log('⚠️ WARNING: Force sync enabled - all tables will be dropped!');
        await sequelize.sync({ force: true, logging: console.log });
        console.log('✅ Database force sync completed');
      } else if (alterSync) {
        console.log('🔄 Applying schema changes...');
        await sequelize.sync({ alter: true, logging: console.log });
        console.log('✅ Database alter sync completed');
      } else {
        // 기본적으로는 테이블이 없을 때만 생성
        await sequelize.sync({ logging: false });
        console.log('✅ Database sync completed');
      }
    } else {
      console.log('⚠️ Skipping sync in production environment');
    }
    
    // 연결 상태 모니터링 설정
    setupConnectionMonitoring();
    
    return { sequelize, models };
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // 상세한 에러 정보 제공
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Check if PostgreSQL is running and accessible');
      console.error('💡 Verify database credentials in .env file');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('💡 Check database username and password');
    } else if (error.name === 'SequelizeHostNotFoundError') {
      console.error('💡 Check database host configuration');
    } else if (error.original?.code === '3D000') {
      console.error('💡 Database does not exist - please create it first');
      console.error(`💡 Run: createdb ${process.env.DB_NAME || 'secrypt_db'}`);
    }
    
    throw error;
  }
};

// 연결 상태 모니터링
const setupConnectionMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const poolStatus = getPoolStatus();
      if (poolStatus && process.env.LOG_POOL_STATUS === 'true') {
        console.log('📊 Connection Pool:', poolStatus);
      }
    }, 60000);
  }
};

// 연결 풀 상태 확인
const getPoolStatus = () => {
  if (!sequelize) return null;
  
  const pool = sequelize.connectionManager.pool;
  if (!pool) return null;
  
  return {
    size: pool.size,
    available: pool.available,
    using: pool.using,
    waiting: pool.waiting
  };
};

// 데이터베이스 연결 종료
const closeDatabase = async () => {
  if (sequelize) {
    console.log('🔌 Closing database connections...');
    await sequelize.close();
    console.log('✅ Database connections closed');
  }
};

// 트랜잭션 헬퍼
const withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// 모델 접근 함수들
const getModels = () => {
  if (!models) {
    throw new Error('Models not initialized. Call connectDB() first.');
  }
  return models;
};

const getModel = (modelName) => {
  const allModels = getModels();
  if (!allModels[modelName]) {
    throw new Error(`Model ${modelName} not found`);
  }
  return allModels[modelName];
};

// Graceful Shutdown 핸들러
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, closing database connections...');
  await closeDatabase();
  process.exit(0);
});

module.exports = {
  connectDB,
  withTransaction,
  getPoolStatus,
  closeDatabase,
  getSequelize: () => sequelize,
  getModels,
  getModel
};