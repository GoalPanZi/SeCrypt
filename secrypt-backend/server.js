require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

// 설정 및 유틸리티 불러오기
const { connectDB } = require('./src/config/database');
const configureApp = require('./src/config/app');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { gracefulShutdown, setupProcessHandlers } = require('./src/utils/processHandlers');
const { createDirectories } = require('./src/utils/fileUtils');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    console.log('🚀 Starting SeCrypt Server...');
    console.log(`Environment: ${NODE_ENV}`);
    
    // 1. 필수 디렉토리 생성
    console.log('📁 Creating necessary directories...');
    createDirectories();
    
    // routes 디렉토리도 확인
    const routesDir = path.join(__dirname, 'src', 'routes');
    if (!fs.existsSync(routesDir)) {
      fs.mkdirSync(routesDir, { recursive: true });
      console.log('📁 Created routes directory');
    }
    
    // 2. 데이터베이스 연결
    console.log('🗄️ Connecting to database...');
    await connectDB();
    
    // 3. Express 앱 설정 (미들웨어, 보안, CORS 등)
    console.log('⚙️ Configuring Express application...');
    configureApp(app);
    
    // 4. API 라우트 설정
    console.log('🛤️ Setting up API routes...');
    
    // 라우트 파일 존재 여부 확인
    const routeFilePath = path.join(__dirname, 'src', 'routes', 'index.js');
    
    if (fs.existsSync(routeFilePath)) {
      try {
        console.log('📋 Loading route file:', routeFilePath);
        const apiRoutes = require('./src/routes/index');
        
        // 라우터가 올바른 타입인지 확인
        if (typeof apiRoutes === 'function') {
          app.use('/api', apiRoutes);
          console.log('✅ API routes loaded successfully');
        } else {
          throw new Error('Route file does not export a valid router function');
        }
        
      } catch (routeError) {
        console.error('❌ Error loading API routes:', routeError.message);
        console.log('📝 Creating fallback routes...');
        createFallbackRoutes(app);
      }
    } else {
      console.warn('⚠️ Route file not found:', routeFilePath);
      console.log('📝 Creating fallback routes...');
      createFallbackRoutes(app);
    }
    
    // 5. 404 핸들러 (모든 라우트 다음에)
    app.use((req, res, next) => {  // 패턴 없는 미들웨어 사용
      res.status(404).json({
        error: 'Route not found',
        message: `${req.method} ${req.originalUrl} does not exist.`
      });
    });
    
    // 6. 에러 핸들러 (가장 마지막)
    app.use(errorHandler);
    
    // 7. HTTP 서버 시작
    console.log('🌐 Starting HTTP server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🎉 SeCrypt Server Started Successfully!');
      console.log('==========================================');
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💓 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 API Test: http://localhost:${PORT}/api/test`);
      console.log(`📁 File Uploads: http://localhost:${PORT}/uploads`);
      console.log('==========================================');
      
      // 개발 환경에서 추가 정보
      if (NODE_ENV === 'development') {
        console.log('\n🔧 Development Info:');
        console.log(`📊 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
        console.log(`⚡ Node Version: ${process.version}`);
        console.log(`📦 Working Directory: ${process.cwd()}`);
        console.log(`📁 Routes Directory: ${routesDir}`);
      }
      
      console.log('\n✅ Server is ready to accept requests!');
      console.log('💡 Try visiting: http://localhost:3000/api');
      console.log('');
    });

    // 서버 에러 핸들링
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try using a different port with: PORT=3001 npm run dev');
      } else {
        console.error('❌ Server error:', error.message);
      }
      process.exit(1);
    });
    
    // 전역 서버 객체 설정 (graceful shutdown용)
    global.server = server;
    
    // 프로세스 신호 핸들러 설정
    console.log('🔧 Setting up process handlers...');
    setupProcessHandlers(gracefulShutdown);
    
  } catch (error) {
    console.error('\n❌ Failed to start server:');
    console.error('Error:', error.message);
    
    if (error.stack && NODE_ENV === 'development') {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    // 구체적인 에러 해결 방법 제시
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Database connection failed. Please check:');
      console.error('   - PostgreSQL server is running');
      console.error('   - Database credentials in .env file');
      console.error('   - Database exists and is accessible');
    } else if (error.message.includes('EADDRINUSE')) {
      console.error(`\n💡 Port ${PORT} is already in use.`);
      console.error('   Try: PORT=3001 npm run dev');
    } else if (error.message.includes('MODULE_NOT_FOUND')) {
      console.error('\n💡 Missing dependencies. Please run:');
      console.error('   npm install');
    }
    
    process.exit(1);
  }
};

// 폴백 라우트 생성 함수
function createFallbackRoutes(app) {
  console.log('🔧 Setting up fallback routes...');
  
  // 기본 API 라우트
  app.get('/api', (req, res) => {
    res.json({
      message: 'SeCrypt API is running',
      status: 'OK',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      note: 'Using fallback routes - please create proper route files'
    });
  });
  
  // API 헬스 체크
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      api: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // 테스트 엔드포인트
  app.get('/api/test', (req, res) => {
    res.json({
      message: 'API test successful (fallback route)',
      timestamp: new Date().toISOString(),
      requestInfo: {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress
      }
    });
  });
  
  console.log('✅ Fallback routes created');
}

// 처리되지 않은 에러 캐칭
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error.message);
  if (NODE_ENV === 'development') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// 서버 시작
startServer();

module.exports = app;