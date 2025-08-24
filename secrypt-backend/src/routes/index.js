const express = require('express');
const router = express.Router();

// 라우트 파일들 import (아직 생성되지 않았지만 향후 추가 예정)
// const authRoutes = require('./auth');
// const userRoutes = require('./users');
// const chatRoutes = require('./chats');
// const messageRoutes = require('./messages');
// const fileRoutes = require('./files');

// API 상태 확인
router.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SeCrypt API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 임시 테스트 라우트 (데이터베이스 연결 확인용)
router.get('/db-test', async (req, res) => {
  try {
    const { getSequelize } = require('../config/database');
    const sequelize = getSequelize();
    
    if (!sequelize) {
      return res.status(500).json({
        error: 'Database not connected',
        message: 'Sequelize instance not found'
      });
    }
    
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    
    // 모델 상태 확인
    const models = sequelize.models;
    const modelNames = Object.keys(models);
    
    res.json({
      status: 'OK',
      message: 'Database connection successful',
      models: modelNames,
      modelCount: modelNames.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 라우트 등록 (향후 추가될 예정)
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/chats', chatRoutes);
// router.use('/messages', messageRoutes);
// router.use('/files', fileRoutes);

// 404 처리
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested API endpoint ${req.originalUrl} does not exist.`,
    availableEndpoints: [
      'GET /api/status',
      'GET /api/db-test'
    ]
  });
});

module.exports = router;