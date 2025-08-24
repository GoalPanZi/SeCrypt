const fs = require('fs');
const path = require('path');

const NODE_ENV = process.env.NODE_ENV || 'development';

// 로그 디렉토리 생성
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 로그 파일 경로
const getLogFilePath = (type) => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `${type}-${date}.log`);
};

// 로그 포맷터
const formatLog = (req, res, duration, error = null) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const status = res.statusCode;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress;
  const contentLength = res.get('Content-Length') || 0;
  
  // 기본 로그 정보
  const logData = {
    timestamp,
    method,
    url,
    status,
    duration: `${duration}ms`,
    ip,
    userAgent,
    contentLength: `${contentLength} bytes`
  };
  
  // 에러가 있으면 추가
  if (error) {
    logData.error = {
      name: error.name,
      message: error.message,
      stack: NODE_ENV === 'development' ? error.stack : undefined
    };
  }
  
  return JSON.stringify(logData, null, 2);
};

// 파일에 로그 작성
const writeLogToFile = (logData, type = 'access') => {
  const logFile = getLogFilePath(type);
  const logEntry = logData + '\n' + '-'.repeat(80) + '\n';
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write log file:', err);
    }
  });
};

// 콘솔에 컬러풀한 로그 출력
const logToConsole = (req, res, duration, error = null) => {
  const timestamp = new Date().toLocaleString();
  const method = req.method;
  const url = req.originalUrl;
  const status = res.statusCode;
  
  // 상태 코드에 따른 색상 설정
  let statusColor = '\x1b[32m'; // 기본 녹색
  if (status >= 400 && status < 500) {
    statusColor = '\x1b[33m'; // 노란색 (클라이언트 에러)
  } else if (status >= 500) {
    statusColor = '\x1b[31m'; // 빨간색 (서버 에러)
  }
  
  // 메소드에 따른 색상
  let methodColor = '\x1b[36m'; // 시안색
  if (method === 'POST') methodColor = '\x1b[32m'; // 녹색
  if (method === 'PUT') methodColor = '\x1b[33m'; // 노란색
  if (method === 'DELETE') methodColor = '\x1b[31m'; // 빨간색
  
  const reset = '\x1b[0m';
  
  // 기본 로그 출력
  console.log(
    `${methodColor}${method}${reset} ` +
    `${url} ` +
    `${statusColor}${status}${reset} ` +
    `${duration}ms ` +
    `- ${timestamp}`
  );
  
  // 에러가 있으면 추가 출력
  if (error) {
    console.error(`\x1b[31mError: ${error.message}${reset}`);
    if (NODE_ENV === 'development' && error.stack) {
      console.error(`\x1b[90m${error.stack}${reset}`);
    }
  }
};

// 메인 로거 미들웨어
const logger = (req, res, next) => {
  const startTime = Date.now();
  
  // 요청 정보 로깅 (개발 환경에서만)
  if (NODE_ENV === 'development') {
    console.log(`\n📥 Incoming Request: ${req.method} ${req.originalUrl}`);
    
    if (Object.keys(req.query).length > 0) {
      console.log('Query Params:', req.query);
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      // 비밀번호 등 민감한 정보 마스킹
      const maskedBody = { ...req.body };
      if (maskedBody.password) maskedBody.password = '***';
      if (maskedBody.passwordHash) maskedBody.passwordHash = '***';
      console.log('Request Body:', maskedBody);
    }
  }
  
  // 응답 완료 시 로그 작성
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 콘솔 출력
    logToConsole(req, res, duration);
    
    // 파일 로그 작성 (프로덕션에서만)
    if (NODE_ENV === 'production') {
      const logData = formatLog(req, res, duration);
      writeLogToFile(logData, 'access');
    }
    
    // 에러 로그 (상태 코드 400 이상)
    if (res.statusCode >= 400) {
      const errorLogData = formatLog(req, res, duration, {
        name: 'HTTPError',
        message: `HTTP ${res.statusCode} Error`
      });
      
      if (NODE_ENV === 'production') {
        writeLogToFile(errorLogData, 'error');
      }
    }
  });
  
  // 에러 핸들링
  res.on('error', (error) => {
    const duration = Date.now() - startTime;
    
    // 콘솔 출력
    logToConsole(req, res, duration, error);
    
    // 에러 로그 파일 작성
    const errorLogData = formatLog(req, res, duration, error);
    writeLogToFile(errorLogData, 'error');
  });
  
  next();
};

// 로그 파일 정리 (30일 이상 된 파일 삭제)
const cleanupOldLogs = () => {
  try {
    const files = fs.readdirSync(logDir);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
  }
};

// 매일 자정에 로그 정리 실행
if (NODE_ENV === 'production') {
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // 24시간마다
}

// API 호출 통계를 위한 간단한 메트릭 수집
const metrics = {
  requests: 0,
  errors: 0,
  totalDuration: 0,
  endpoints: {}
};

const updateMetrics = (req, res, duration) => {
  metrics.requests++;
  metrics.totalDuration += duration;
  
  if (res.statusCode >= 400) {
    metrics.errors++;
  }
  
  const endpoint = `${req.method} ${req.route?.path || req.originalUrl}`;
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = { count: 0, totalTime: 0, errors: 0 };
  }
  
  metrics.endpoints[endpoint].count++;
  metrics.endpoints[endpoint].totalTime += duration;
  
  if (res.statusCode >= 400) {
    metrics.endpoints[endpoint].errors++;
  }
};

// 메트릭 조회 함수
const getMetrics = () => {
  const avgDuration = metrics.requests > 0 ? metrics.totalDuration / metrics.requests : 0;
  const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) : 0;
  
  return {
    summary: {
      totalRequests: metrics.requests,
      totalErrors: metrics.errors,
      errorRate: `${errorRate}%`,
      averageResponseTime: `${avgDuration.toFixed(2)}ms`
    },
    endpoints: Object.keys(metrics.endpoints).map(endpoint => ({
      endpoint,
      ...metrics.endpoints[endpoint],
      avgTime: (metrics.endpoints[endpoint].totalTime / metrics.endpoints[endpoint].count).toFixed(2) + 'ms',
      errorRate: ((metrics.endpoints[endpoint].errors / metrics.endpoints[endpoint].count) * 100).toFixed(2) + '%'
    }))
  };
};

// 메트릭 업데이트를 로거에 통합
const originalLogger = logger;
const enhancedLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    updateMetrics(req, res, duration);
  });
  
  return originalLogger(req, res, next);
};

module.exports = enhancedLogger;
module.exports.getMetrics = getMetrics;
module.exports.cleanupOldLogs = cleanupOldLogs;