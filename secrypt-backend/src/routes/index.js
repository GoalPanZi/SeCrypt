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
    documentation: {
      postman: '/api/docs/postman',
      swagger: '/api/docs/swagger',
      readme: 'https://github.com/secrypt/backend/README.md'
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*', 
      chats: '/api/chats/*',
      messages: '/api/messages/*',
      files: '/api/files/*'
    },
    features: {
      authentication: 'JWT Token based',
      encryption: 'End-to-end encryption',
      fileSharing: 'Secure file upload/download',
      realtime: 'WebSocket support (planned)',
      rateLimit: 'Active'
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
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100) + '%'
    },
    environment: process.env.NODE_ENV || 'development',
    version: {
      node: process.version,
      api: '1.0.0'
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
      userAgent: req.get('User-Agent'),
      headers: {
        contentType: req.get('Content-Type'),
        authorization: req.get('Authorization') ? '[PRESENT]' : '[NOT_PRESENT]'
      }
    },
    serverInfo: {
      platform: process.platform,
      arch: process.arch,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pid: process.pid
    }
  });
});

// 서브 라우터들 등록
try {
  console.log('🔐 Loading authentication routes...');
  const authRoutes = require('./auth');
  router.use('/auth', authRoutes);
  console.log('✅ Authentication routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
}

try {
  console.log('👤 Loading user routes...');
  const userRoutes = require('./users');
  router.use('/users', userRoutes);
  console.log('✅ User routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load user routes:', error.message);
}

try {
  console.log('💬 Loading chat routes...');
  const chatRoutes = require('./chats');
  router.use('/chats', chatRoutes);
  console.log('✅ Chat routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load chat routes:', error.message);
}

try {
  console.log('📨 Loading message routes...');
  const messageRoutes = require('./messages');
  router.use('/messages', messageRoutes);
  console.log('✅ Message routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load message routes:', error.message);
}

try {
  console.log('📁 Loading file routes...');
  const fileRoutes = require('./files');
  router.use('/files', fileRoutes);
  console.log('✅ File routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load file routes:', error.message);
}

// API 문서 라우트 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  router.get('/docs', (req, res) => {
    res.json({
      message: 'SeCrypt API Documentation',
      timestamp: new Date().toISOString(),
      routes: {
        authentication: {
          baseUrl: '/api/auth',
          endpoints: [
            'POST /register - User registration',
            'POST /login - User login',
            'POST /logout - User logout',
            'GET /verify-email/:token - Email verification',
            'POST /forgot-password - Password reset request',
            'POST /reset-password/:token - Password reset',
            'POST /refresh-token - Token refresh',
            'GET /me - Current user info',
            'PUT /change-password - Change password',
            'POST /2fa/enable - Enable 2FA',
            'POST /2fa/verify - Verify 2FA',
            'DELETE /2fa/disable - Disable 2FA'
          ]
        },
        users: {
          baseUrl: '/api/users',
          endpoints: [
            'GET /me - Current user profile',
            'PUT /me - Update profile',
            'POST /me/avatar - Upload avatar',
            'DELETE /me/avatar - Delete avatar',
            'PUT /me/settings - Update settings',
            'PUT /me/status - Update status',
            'GET /contacts - Get contacts',
            'POST /contacts - Add contact',
            'DELETE /contacts/:userId - Remove contact',
            'GET /blocked - Get blocked users',
            'POST /block - Block user',
            'DELETE /block/:userId - Unblock user',
            'GET /search - Search users',
            'GET /:userId - Get user profile'
          ]
        },
        chats: {
          baseUrl: '/api/chats',
          endpoints: [
            'GET / - Get user chats',
            'GET /:chatId - Get chat details',
            'POST /direct - Create direct chat',
            'POST /group - Create group chat',
            'PUT /:chatId - Update chat info',
            'DELETE /:chatId - Leave/delete chat',
            'POST /:chatId/archive - Archive chat',
            'DELETE /:chatId/archive - Unarchive chat',
            'GET /:chatId/participants - Get participants',
            'POST /:chatId/participants - Add participants',
            'DELETE /:chatId/participants/:userId - Remove participant',
            'POST /:chatId/leave - Leave chat',
            'POST /:chatId/invite-code - Generate invite code',
            'POST /join/:inviteCode - Join by invite code'
          ]
        },
        messages: {
          baseUrl: '/api/messages',
          endpoints: [
            'GET /chat/:chatId - Get chat messages',
            'GET /:messageId - Get message details',
            'POST / - Send message',
            'PUT /:messageId - Edit message',
            'DELETE /:messageId - Delete message',
            'POST /:messageId/forward - Forward message',
            'POST /reply - Reply to message',
            'POST /:messageId/reactions - React to message',
            'DELETE /:messageId/reactions/:emoji - Remove reaction',
            'GET /:messageId/reactions - Get message reactions',
            'POST /:messageId/read - Mark as read',
            'POST /chat/:chatId/read-all - Mark all as read',
            'GET /unread-count - Get unread count',
            'GET /search - Search messages'
          ]
        },
        files: {
          baseUrl: '/api/files',
          endpoints: [
            'POST /upload - Upload file',
            'POST /upload/avatar - Upload avatar',
            'POST /upload/chat-avatar - Upload chat avatar',
            'GET /:fileId/download - Download file',
            'GET /:fileId - Get file info',
            'GET /:fileId/preview - Get file preview',
            'GET /:fileId/thumbnail - Get thumbnail',
            'PUT /:fileId - Update file info',
            'DELETE /:fileId - Delete file',
            'POST /:fileId/share - Share file',
            'GET /shared/:shareToken - Access shared file',
            'GET / - Get user files',
            'GET /chat/:chatId - Get chat files',
            'GET /search - Search files',
            'GET /stats - Get file statistics',
            'GET /storage - Get storage info'
          ]
        }
      },
      testEndpoints: {
        note: 'These endpoints are available for testing in development',
        routes: [
          'GET /api/auth/test',
          'GET /api/users/test',
          'GET /api/chats/test',
          'GET /api/messages/test',
          'GET /api/files/test',
          'POST /api/auth/mock-register',
          'POST /api/auth/mock-login',
          'GET /api/users/mock/:count',
          'GET /api/chats/mock/generate/:count',
          'POST /api/messages/mock-send',
          'GET /api/messages/mock/generate/:chatId/:count',
          'POST /api/files/mock-upload',
          'GET /api/files/mock/generate/:count'
        ]
      },
      responseFormat: {
        success: {
          message: 'Description of the response',
          data: '// Response data object',
          timestamp: '// ISO timestamp'
        },
        error: {
          error: 'Error message',
          details: '// Additional error details',
          timestamp: '// ISO timestamp',
          path: '// Request path',
          method: '// HTTP method'
        }
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
        note: 'Include JWT token in Authorization header for protected routes'
      },
      rateLimit: {
        general: '100 requests per 15 minutes',
        auth: '5 requests per 15 minutes',
        upload: '20 requests per hour (production), 100 requests per hour (development)'
      }
    });
  });

  // Postman Collection 생성
  router.get('/docs/postman', (req, res) => {
    res.json({
      info: {
        name: 'SeCrypt API',
        description: 'Secure encrypted chat application API',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      note: 'Import this JSON into Postman to test the API',
      variables: [
        {
          key: 'baseUrl',
          value: `${req.protocol}://${req.get('host')}/api`,
          type: 'string'
        },
        {
          key: 'authToken',
          value: '',
          type: 'string',
          description: 'JWT token obtained from login'
        }
      ],
      exampleRequests: {
        register: {
          method: 'POST',
          url: '{{baseUrl}}/auth/register',
          body: {
            email: 'user@example.com',
            name: 'Test User',
            password: 'SecurePassword123',
            confirmPassword: 'SecurePassword123'
          }
        },
        login: {
          method: 'POST',
          url: '{{baseUrl}}/auth/login',
          body: {
            email: 'user@example.com',
            password: 'SecurePassword123'
          }
        },
        sendMessage: {
          method: 'POST',
          url: '{{baseUrl}}/messages',
          headers: {
            Authorization: 'Bearer {{authToken}}'
          },
          body: {
            chatId: 'chat-123',
            content: 'Hello, this is a test message!',
            type: 'text'
          }
        }
      }
    });
  });
}

// 상태 체크 엔드포인트
router.get('/status', (req, res) => {
  const status = {
    api: 'operational',
    database: 'connected', // TODO: 실제 DB 상태 확인
    services: {
      authentication: 'operational',
      fileUpload: 'operational',
      encryption: 'operational',
      notifications: 'planned'
    },
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  };

  res.json(status);
});

// 메트릭스 엔드포인트 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  router.get('/metrics', (req, res) => {
    const metrics = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      api: {
        totalRequests: 0, // TODO: 실제 메트릭 수집
        errorRate: '0%',
        averageResponseTime: '0ms',
        activeConnections: 0
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  });
}

console.log('✅ API routes loaded');

module.exports = router;