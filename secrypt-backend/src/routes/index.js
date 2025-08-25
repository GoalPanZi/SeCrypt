// src/routes/index.js
const express = require('express');
const router = express.Router();

console.log('📋 Loading API routes...');

// 기본 API 정보
router.get('/', (req, res) => {
  res.json({
    message: 'SeCrypt API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*', 
      chats: '/api/chats/*',
      messages: '/api/messages/*',
      files: '/api/files/*'
    }
  });
});

// API 헬스 체크
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    api: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// 테스트 라우트
router.get('/test', (req, res) => {
  res.json({
    message: 'API test successful',
    timestamp: new Date().toISOString(),
    requestInfo: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
});

// TODO: 나중에 추가할 라우트들
/*
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/chats', require('./chats'));
router.use('/messages', require('./messages'));
router.use('/files', require('./files'));
*/

console.log('✅ API routes loaded');

module.exports = router;