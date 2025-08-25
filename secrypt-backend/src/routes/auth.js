const express = require('express');
const router = express.Router();
const { rateLimiters } = require('../config/rateLimiter');

console.log('🔐 Loading authentication routes...');

// TODO: 컨트롤러 import (나중에 생성 후 활성화)
// const { 
//   register, 
//   login, 
//   logout, 
//   verifyEmail, 
//   forgotPassword, 
//   resetPassword,
//   refreshToken,
//   changePassword,
//   enable2FA,
//   verify2FA,
//   disable2FA
// } = require('../controllers/authController');

// TODO: 미들웨어 import (나중에 생성 후 활성화)
// const { authenticateToken } = require('../middlewares/auth');
// const { validateRegistration, validateLogin } = require('../middlewares/validation');

// 임시 응답 함수
const tempResponse = (action) => (req, res) => {
  res.status(501).json({
    message: `${action} endpoint not implemented yet`,
    note: 'Controller and middleware need to be created',
    receivedData: {
      body: req.body,
      params: req.params,
      query: req.query
    },
    timestamp: new Date().toISOString()
  });
};

// =============================================================================
// 공개 인증 엔드포인트 (인증 불필요)
// =============================================================================

/**
 * @route POST /api/auth/register
 * @desc 사용자 회원가입
 * @access Public
 * @body { email, name, password, confirmPassword }
 */
router.post('/register', 
  rateLimiters.auth,
  // validateRegistration, // TODO: 나중에 활성화
  tempResponse('User Registration')
  // register // TODO: 나중에 활성화
);

/**
 * @route POST /api/auth/login
 * @desc 사용자 로그인
 * @access Public
 * @body { email, password, remember?, twoFactorCode? }
 */
router.post('/login',
  rateLimiters.auth,
  // validateLogin, // TODO: 나중에 활성화
  tempResponse('User Login')
  // login // TODO: 나중에 활성화
);

/**
 * @route POST /api/auth/logout
 * @desc 사용자 로그아웃 (토큰 무효화)
 * @access Private
 * @headers { Authorization: "Bearer <token>" }
 */
router.post('/logout',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('User Logout')
  // logout // TODO: 나중에 활성화
);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc 이메일 인증
 * @access Public
 * @params { token }
 */
router.get('/verify-email/:token',
  tempResponse('Email Verification')
  // verifyEmail // TODO: 나중에 활성화
);

/**
 * @route POST /api/auth/forgot-password
 * @desc 비밀번호 재설정 요청
 * @access Public
 * @body { email }
 */
router.post('/forgot-password',
  rateLimiters.auth,
  tempResponse('Forgot Password')
  // forgotPassword // TODO: 나중에 활성화
);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc 비밀번호 재설정
 * @access Public
 * @params { token }
 * @body { password, confirmPassword }
 */
router.post('/reset-password/:token',
  rateLimiters.auth,
  tempResponse('Reset Password')
  // resetPassword // TODO: 나중에 활성화
);

/**
 * @route POST /api/auth/refresh-token
 * @desc 액세스 토큰 갱신
 * @access Public
 * @body { refreshToken }
 */
router.post('/refresh-token',
  tempResponse('Refresh Token')
  // refreshToken // TODO: 나중에 활성화
);

// =============================================================================
// 인증 필요 엔드포인트
// =============================================================================

/**
 * @route GET /api/auth/me
 * @desc 현재 사용자 정보 조회
 * @access Private
 * @headers { Authorization: "Bearer <token>" }
 */
router.get('/me',
  // authenticateToken, // TODO: 나중에 활성화
  (req, res) => {
    res.json({
      message: 'Current user info endpoint',
      note: 'This will return authenticated user information',
      mockData: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        emailVerified: true,
        twoFactorEnabled: false,
        status: 'online',
        lastSeen: new Date().toISOString(),
        profileImage: null
      }
    });
  }
);

/**
 * @route PUT /api/auth/change-password
 * @desc 비밀번호 변경
 * @access Private
 * @body { currentPassword, newPassword, confirmPassword }
 */
router.put('/change-password',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Change Password')
  // changePassword // TODO: 나중에 활성화
);

// =============================================================================
// 2단계 인증 (2FA) 엔드포인트
// =============================================================================

/**
 * @route POST /api/auth/2fa/enable
 * @desc 2단계 인증 활성화
 * @access Private
 * @headers { Authorization: "Bearer <token>" }
 */
router.post('/2fa/enable',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Enable 2FA')
  // enable2FA // TODO: 나중에 활성화
);

/**
 * @route POST /api/auth/2fa/verify
 * @desc 2단계 인증 코드 검증
 * @access Private
 * @body { code }
 */
router.post('/2fa/verify',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Verify 2FA')
  // verify2FA // TODO: 나중에 활성화
);

/**
 * @route DELETE /api/auth/2fa/disable
 * @desc 2단계 인증 비활성화
 * @access Private
 * @body { password }
 */
router.delete('/2fa/disable',
  // authenticateToken, // TODO: 나중에 활성화
  tempResponse('Disable 2FA')
  // disable2FA // TODO: 나중에 활성화
);

// =============================================================================
// 개발/테스트 엔드포인트
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * @route GET /api/auth/test
   * @desc 인증 라우터 테스트
   * @access Public
   */
  router.get('/test', (req, res) => {
    res.json({
      message: 'Auth router test successful',
      timestamp: new Date().toISOString(),
      availableEndpoints: {
        public: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'GET /api/auth/verify-email/:token',
          'POST /api/auth/forgot-password',
          'POST /api/auth/reset-password/:token',
          'POST /api/auth/refresh-token'
        ],
        private: [
          'GET /api/auth/me',
          'POST /api/auth/logout',
          'PUT /api/auth/change-password',
          'POST /api/auth/2fa/enable',
          'POST /api/auth/2fa/verify',
          'DELETE /api/auth/2fa/disable'
        ]
      },
      note: 'All endpoints return 501 until controllers are implemented'
    });
  });

  /**
   * @route POST /api/auth/mock-register
   * @desc 목업 회원가입 (테스트용)
   */
  router.post('/mock-register', (req, res) => {
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'name', 'password']
      });
    }

    res.status(201).json({
      message: 'Mock registration successful',
      user: {
        id: `user-${Date.now()}`,
        email,
        name,
        emailVerified: false,
        createdAt: new Date().toISOString()
      },
      token: 'mock-jwt-token-here',
      note: 'This is a mock response for testing'
    });
  });

  /**
   * @route POST /api/auth/mock-login
   * @desc 목업 로그인 (테스트용)
   */
  router.post('/mock-login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing email or password'
      });
    }

    // 목업 로그인 실패 케이스
    if (email === 'wrong@example.com') {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    res.json({
      message: 'Mock login successful',
      user: {
        id: 'user-123',
        email,
        name: 'Test User',
        emailVerified: true
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      },
      expiresIn: 3600,
      note: 'This is a mock response for testing'
    });
  });
}

console.log('✅ Authentication routes loaded');

module.exports = router;