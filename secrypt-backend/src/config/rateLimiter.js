const rateLimit = require('express-rate-limit');

const NODE_ENV = process.env.NODE_ENV || 'development';

// 일반 API 요청 제한
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: NODE_ENV === 'production' ? 100 : 1000, // 프로덕션에서는 더 엄격하게
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 인증 관련 요청 제한 (더 엄격)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 로그인/회원가입 시도 제한
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 파일 업로드 제한
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: NODE_ENV === 'production' ? 20 : 100,
  message: {
    error: 'Too many file uploads, please try again later.'
  }
});

const rateLimiters = {
  general: generalLimiter,
  auth: authLimiter,
  upload: uploadLimiter
};

module.exports = { rateLimiters };