const NODE_ENV = process.env.NODE_ENV || 'development';

const gracefulShutdown = (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  if (!global.server) {
    console.error('❌ Server instance not found');
    process.exit(1);
  }
  
  global.server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    
    // 데이터베이스 연결 종료
    require('mongoose').connection.close(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
  
  // 강제 종료 (30초 후)
  setTimeout(() => {
    console.error('❌ Forcing server shutdown after timeout');
    process.exit(1);
  }, 30000);
};

const setupProcessHandlers = (shutdownHandler) => {
  // Graceful Shutdown 이벤트 리스너
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  
  // 처리되지 않은 Promise rejection 처리
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    
    if (NODE_ENV === 'production') {
      shutdownHandler('unhandledRejection');
    }
  });

  // 처리되지 않은 Exception 처리
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    
    if (NODE_ENV === 'production') {
      shutdownHandler('uncaughtException');
    }
  });
};

module.exports = {
  gracefulShutdown,
  setupProcessHandlers
};