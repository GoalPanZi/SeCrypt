const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { rateLimiters } = require('./rateLimiter');
const logger = require('../middlewares/logger');

const configureApp = (app) => {
  const NODE_ENV = process.env.NODE_ENV || 'development';

  // 보안 미들웨어
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
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  app.use(cors(corsOptions));

  // Rate Limiting
  app.use('/api/', rateLimiters.general);
  app.use('/api/auth/login', rateLimiters.auth);
  app.use('/api/auth/register', rateLimiters.auth);

  // Body parsing 미들웨어
  app.use(express.json({ 
    limit: '50mb',
    type: 'application/json'
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb'
  }));

  // 로깅 미들웨어
  app.use(logger);

  // 정적 파일 제공
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Health Check 엔드포인트
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // 루트 경로
  app.get('/', (req, res) => {
    res.json({
      message: 'SeCrypt API Server',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health'
    });
  });

  // 404 핸들러
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      message: `The requested route ${req.originalUrl} does not exist.`
    });
  });

  // 개발 환경에서 메모리 모니터링
  if (NODE_ENV === 'development') {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      console.log('📊 Memory Usage:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
      });
    }, 30000);
  }
};

module.exports = configureApp;