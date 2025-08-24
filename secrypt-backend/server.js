require('dotenv').config();

const express = require('express');
const connectDB = require('./src/config/database');
const configureApp = require('./src/config/app');
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');
const { gracefulShutdown, setupProcessHandlers } = require('./src/utils/processHandlers');
const { createDirectories } = require('./src/utils/fileUtils');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // 필수 디렉토리 생성
    createDirectories();
    
    // 데이터베이스 연결
    await connectDB();
    
    // 앱 설정 적용 (미들웨어, 보안 설정 등)
    configureApp(app);
    
    // API 라우트
    app.use('/api', routes);
    
    // 에러 핸들러
    app.use(errorHandler);
    
    // 서버 시작
    const server = app.listen(PORT, () => {
      console.log('\n🚀 SeCrypt Server Started Successfully!');
      console.log('==========================================');
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`💓 Health Check: http://localhost:${PORT}/health`);
      console.log('==========================================\n');
    });
    
    // 전역 서버 객체 설정
    global.server = server;
    
    // 프로세스 핸들러 설정
    setupProcessHandlers(gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;