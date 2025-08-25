const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { rateLimiters } = require('./rateLimiter');
const logger = require('../middlewares/logger');

const configureApp = (app) => {
  const NODE_ENV = process.env.NODE_ENV || 'development';

  console.log('🔧 Configuring Express application...');

  // 보안 미들웨어
  console.log('🛡️ Setting up security middleware...');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // 파일 업로드를 위해 비활성화
  }));

  // CORS 설정
  console.log('🌐 Setting up CORS...');
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  app.use(cors(corsOptions));

  // Rate Limiting (조건부 적용)
  console.log('⏱️ Setting up rate limiting...');
  try {
    app.use('/api/', rateLimiters.general);
    app.use('/api/auth/login', rateLimiters.auth);
    app.use('/api/auth/register', rateLimiters.auth);
    console.log('✅ Rate limiting configured');
  } catch (error) {
    console.warn('⚠️ Rate limiting configuration failed:', error.message);
  }

  // Body parsing 미들웨어
  console.log('📝 Setting up body parsing...');
  app.use(express.json({ 
    limit: '50mb',
    type: 'application/json'
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb'
  }));

  // 로깅 미들웨어
  console.log('📊 Setting up logging...');
  app.use(logger);

  // 정적 파일 제공
  console.log('📁 Setting up static file serving...');
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health Check 엔드포인트 (루트 레벨에서)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  });

  // 루트 경로
  app.get('/', (req, res) => {
    res.json({
      message: 'SeCrypt API Server',
      version: '1.0.0',
      status: 'Running',
      timestamp: new Date().toISOString(),
      documentation: '/api/docs',
      health: '/health',
      endpoints: {
        api: '/api',
        health: '/health',
        uploads: '/uploads'
      }
    });
  });

  // 개발 환경에서 메모리 모니터링
  if (NODE_ENV === 'development') {
    console.log('🔍 Setting up development monitoring...');
    
    // 메모리 모니터링 (30초마다)
    const memoryMonitor = setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log('📊 Memory Usage:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      });
    }, 30000);

    // 서버 종료 시 인터벌 정리
    process.on('SIGTERM', () => clearInterval(memoryMonitor));
    process.on('SIGINT', () => clearInterval(memoryMonitor));
  }

  // 에러 핸들링 미들웨어는 여기서 추가하지 않음 (server.js에서 마지막에 추가)
  
  console.log('✅ Express application configured successfully');
};

module.exports = configureApp;