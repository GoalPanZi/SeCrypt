// scripts/init-db.js
require('dotenv').config();
const { connectDB, closeDatabase, getSequelize } = require('../src/config/database');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Starting database initialization...');
    
    // 데이터베이스 연결
    const { sequelize, models } = await connectDB();
    
    console.log('⚠️  Warning: This will DROP all existing tables!');
    console.log('⏳ Starting in 3 seconds... (Press Ctrl+C to cancel)');
    
    // 3초 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 모든 테이블 삭제 및 재생성
    await sequelize.sync({ force: true });
    
    console.log('✅ Database tables created successfully!');
    
    // 기본 데이터 생성 (선택사항)
    await createSampleData(models);
    
    console.log('✅ Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
};

// 샘플 데이터 생성 함수
const createSampleData = async (models) => {
  try {
    console.log('📝 Creating sample data...');
    
    // 테스트 사용자 생성
    const hashedPassword = await models.User.hashPassword('test123');
    
    const testUser = await models.User.create({
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
      emailVerified: true
    });
    
    console.log('👤 Test user created:', testUser.email);
    
    // 더 많은 샘플 데이터가 필요하면 여기에 추가
    
  } catch (error) {
    console.warn('⚠️ Failed to create sample data:', error.message);
  }
};

// 스크립트 실행
if (require.main === module) {
  initializeDatabase();
}