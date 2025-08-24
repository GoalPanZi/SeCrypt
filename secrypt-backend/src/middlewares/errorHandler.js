const NODE_ENV = process.env.NODE_ENV || 'development';

// Sequelize 에러 처리 함수
const handleSequelizeError = (error) => {
  switch (error.name) {
    case 'SequelizeValidationError':
      return {
        status: 400,
        message: 'Validation Error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      };
      
    case 'SequelizeUniqueConstraintError':
      return {
        status: 409,
        message: 'Duplicate Entry',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      };
      
    case 'SequelizeForeignKeyConstraintError':
      return {
        status: 400,
        message: 'Foreign Key Constraint Error',
        details: 'Referenced record does not exist'
      };
      
    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
      return {
        status: 503,
        message: 'Database Connection Error',
        details: 'Unable to connect to database'
      };
      
    case 'SequelizeTimeoutError':
      return {
        status: 408,
        message: 'Database Timeout',
        details: 'Database query timed out'
      };
      
    default:
      return {
        status: 500,
        message: 'Database Error',
        details: NODE_ENV === 'development' ? error.message : 'Internal database error'
      };
  }
};

// JWT 에러 처리 함수
const handleJWTError = (error) => {
  switch (error.name) {
    case 'JsonWebTokenError':
      return {
        status: 401,
        message: 'Invalid Token',
        details: 'The provided token is invalid'
      };
      
    case 'TokenExpiredError':
      return {
        status: 401,
        message: 'Token Expired',
        details: 'The provided token has expired'
      };
      
    case 'NotBeforeError':
      return {
        status: 401,
        message: 'Token Not Active',
        details: 'The provided token is not active yet'
      };
      
    default:
      return {
        status: 401,
        message: 'Authentication Error',
        details: 'Token authentication failed'
      };
  }
};

// 일반적인 에러 처리 함수
const handleGeneralError = (error) => {
  // 파일 업로드 에러
  if (error.code === 'LIMIT_FILE_SIZE') {
    return {
      status: 413,
      message: 'File Too Large',
      details: 'The uploaded file exceeds the maximum allowed size'
    };
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return {
      status: 413,
      message: 'Too Many Files',
      details: 'The number of uploaded files exceeds the limit'
    };
  }
  
  // 네트워크 에러
  if (error.code === 'ECONNREFUSED') {
    return {
      status: 503,
      message: 'Service Unavailable',
      details: 'Unable to connect to external service'
    };
  }
  
  // 타임아웃 에러
  if (error.code === 'ETIMEDOUT') {
    return {
      status: 408,
      message: 'Request Timeout',
      details: 'The request timed out'
    };
  }
  
  return {
    status: 500,
    message: 'Internal Server Error',
    details: NODE_ENV === 'development' ? error.message : 'Something went wrong'
  };
};

// 메인 에러 핸들러 미들웨어
const errorHandler = (error, req, res, next) => {
  console.error('🚨 Error occurred:', {
    message: error.message,
    name: error.name,
    stack: NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  let errorResponse;
  
  // Sequelize 에러
  if (error.name && error.name.startsWith('Sequelize')) {
    errorResponse = handleSequelizeError(error);
  }
  // JWT 에러
  else if (error.name && (error.name.includes('JsonWebToken') || error.name.includes('Token'))) {
    errorResponse = handleJWTError(error);
  }
  // 커스텀 에러 (status 속성이 있는 경우)
  else if (error.status || error.statusCode) {
    errorResponse = {
      status: error.status || error.statusCode,
      message: error.message || 'Custom Error',
      details: error.details || null
    };
  }
  // 일반적인 에러
  else {
    errorResponse = handleGeneralError(error);
  }
  
  // 에러 응답 전송
  res.status(errorResponse.status).json({
    error: errorResponse.message,
    details: errorResponse.details,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ...(NODE_ENV === 'development' && {
      stack: error.stack,
      name: error.name
    })
  });
};

// 404 에러 핸들러
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// 비동기 에러 캐치 래퍼
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 에러 생성 유틸리티
const createError = (status, message, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError
};