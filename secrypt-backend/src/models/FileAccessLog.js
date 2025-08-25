const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FileAccessLog = sequelize.define('FileAccessLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    fileId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'file_id',
      references: {
        model: 'files',
        key: 'id'
      }
    },
    
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // 접근 행동 타입
    action: {
      type: DataTypes.ENUM('upload', 'download', 'view', 'delete', 'share', 'decrypt'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['upload', 'download', 'view', 'delete', 'share', 'decrypt']],
          msg: 'Action must be upload, download, view, delete, share, or decrypt'
        }
      }
    },
    
    // 접근 위치 정보
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 지원을 위해 45자
      allowNull: true,
      field: 'ip_address',
      validate: {
        isIP: {
          msg: 'Must be a valid IP address'
        }
      }
    },
    
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    
    // 접근 결과
    status: {
      type: DataTypes.ENUM('success', 'failed', 'unauthorized', 'forbidden'),
      defaultValue: 'success',
      validate: {
        isIn: {
          args: [['success', 'failed', 'unauthorized', 'forbidden']],
          msg: 'Status must be success, failed, unauthorized, or forbidden'
        }
      }
    },
    
    // 실패 사유 (실패 시에만 기록)
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    
    // 접근한 파일 크기 (다운로드 시 전송된 바이트 수)
    bytesTransferred: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'bytes_transferred',
      validate: {
        min: {
          args: 0,
          msg: 'Bytes transferred cannot be negative'
        }
      }
    },
    
    // 소요 시간 (밀리초)
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Duration cannot be negative'
        }
      }
    },
    
    // 추가 메타데이터
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      // 예: { chatId: 'xxx', messageId: 'yyy', thumbnailGenerated: true }
    },
    
    // 지리적 위치 (선택사항)
    location: {
      type: DataTypes.JSON,
      allowNull: true,
      // 예: { country: 'KR', city: 'Seoul', latitude: 37.5665, longitude: 126.9780 }
    },
    
    // 디바이스 정보
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'device_info'
      // 예: { platform: 'web', browser: 'Chrome', version: '91.0', mobile: false }
    },
    
    // 보안 등급 (민감도에 따른 분류)
    securityLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
      field: 'security_level',
      validate: {
        isIn: {
          args: [['low', 'medium', 'high', 'critical']],
          msg: 'Security level must be low, medium, high, or critical'
        }
      }
    }
    
  }, {
    tableName: 'file_access_logs',
    timestamps: true,
    
    indexes: [
      { fields: ['file_id'] },
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
      { fields: ['ip_address'] },
      { fields: ['security_level'] },
      // 복합 인덱스
      { fields: ['file_id', 'action'] },
      { fields: ['user_id', 'action'] },
      { fields: ['file_id', 'createdAt'] },
      { fields: ['action', 'status'] },
      { fields: ['createdAt', 'security_level'] }
    ],
    
    hooks: {
      beforeCreate: async (log) => {
        // IP 주소가 있으면 보안 등급 자동 설정
        if (log.ipAddress) {
          log.securityLevel = determineSecurityLevel(log.action, log.ipAddress);
        }
        
        // 특정 액션에 대한 추가 검증
        if (log.action === 'delete' && log.status === 'success') {
          log.securityLevel = 'high';
        }
      },
      
      afterCreate: async (log) => {
        // 보안 관련 로그는 별도 알림 시스템에 전송
        if (log.securityLevel === 'critical' || log.status === 'unauthorized') {
          // 보안 알림 시스템에 전송 (추후 구현)
          console.warn(`🔐 Security Alert: ${log.action} attempt by user ${log.userId} - Status: ${log.status}`);
        }
        
        // 다운로드 통계 업데이트 (다운로드 성공 시)
        if (log.action === 'download' && log.status === 'success' && sequelize.models.File) {
          const file = await sequelize.models.File.findByPk(log.fileId);
          if (file) {
            await file.increment('downloadCount');
          }
        }
      }
    }
  });
  
  // 인스턴스 메서드
  FileAccessLog.prototype.isSuccessful = function() {
    return this.status === 'success';
  };
  
  FileAccessLog.prototype.isSuspicious = function() {
    return this.status === 'unauthorized' || 
           this.status === 'forbidden' || 
           this.securityLevel === 'critical';
  };
  
  FileAccessLog.prototype.getFormattedDuration = function() {
    if (!this.duration) return 'N/A';
    
    if (this.duration < 1000) {
      return `${this.duration}ms`;
    } else if (this.duration < 60000) {
      return `${(this.duration / 1000).toFixed(1)}s`;
    } else {
      return `${(this.duration / 60000).toFixed(1)}m`;
    }
  };
  
  FileAccessLog.prototype.getFormattedBytes = function() {
    if (!this.bytesTransferred) return 'N/A';
    
    const bytes = parseInt(this.bytesTransferred);
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  FileAccessLog.prototype.toSafeJSON = function() {
    const log = this.toJSON();
    
    // 민감한 정보는 관리자만 볼 수 있도록 제한
    return {
      id: log.id,
      action: log.action,
      status: log.status,
      createdAt: log.createdAt,
      duration: log.duration ? this.getFormattedDuration() : null,
      bytesTransferred: log.bytesTransferred ? this.getFormattedBytes() : null
    };
  };
  
  FileAccessLog.prototype.toDetailedJSON = function() {
    // 관리자용 상세 정보 포함
    const log = this.toJSON();
    
    return {
      ...log,
      formattedDuration: this.getFormattedDuration(),
      formattedBytes: this.getFormattedBytes(),
      isSuspicious: this.isSuspicious()
    };
  };
  
  // 클래스 메서드 (Static methods)
  FileAccessLog.logAccess = async function(options) {
    const {
      fileId,
      userId,
      action,
      status = 'success',
      ipAddress = null,
      userAgent = null,
      errorMessage = null,
      bytesTransferred = null,
      duration = null,
      metadata = {},
      deviceInfo = null
    } = options;
    
    return await this.create({
      fileId,
      userId,
      action,
      status,
      ipAddress,
      userAgent,
      errorMessage,
      bytesTransferred,
      duration,
      metadata,
      deviceInfo
    });
  };
  
  FileAccessLog.getFileAccessHistory = async function(fileId, options = {}) {
    const { limit = 100, offset = 0, action = null, status = null } = options;
    
    const whereClause = { fileId };
    if (action) whereClause.action = action;
    if (status) whereClause.status = status;
    
    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  };
  
  FileAccessLog.getUserAccessHistory = async function(userId, options = {}) {
    const { limit = 100, offset = 0, action = null, days = 30 } = options;
    
    const whereClause = { userId };
    if (action) whereClause.action = action;
    
    // 최근 N일 이내 로그만 조회
    if (days) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      };
    }
    
    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.File,
          as: 'file',
          attributes: ['id', 'filename', 'originalName', 'mimeType']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  };
  
  FileAccessLog.getAccessStats = async function(options = {}) {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 기본 30일
      endDate = new Date(),
      fileId = null,
      userId = null
    } = options;
    
    const whereClause = {
      createdAt: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (fileId) whereClause.fileId = fileId;
    if (userId) whereClause.userId = userId;
    
    return await this.findAll({
      where: whereClause,
      attributes: [
        'action',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('bytesTransferred')), 'totalBytes']
      ],
      group: ['action', 'status'],
      raw: true
    });
  };
  
  FileAccessLog.getSuspiciousActivity = async function(options = {}) {
    const { 
      hours = 24, // 최근 24시간
      minAttempts = 5 // 최소 시도 횟수
    } = options;
    
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // 실패한 접근 시도가 많은 IP 주소들 조회
    return await this.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: timeThreshold
        },
        status: ['failed', 'unauthorized', 'forbidden']
      },
      attributes: [
        'ipAddress',
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'attempts'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastAttempt']
      ],
      group: ['ipAddress', 'userId'],
      having: sequelize.literal(`COUNT(id) >= ${minAttempts}`),
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };
  
  FileAccessLog.getPopularFiles = async function(options = {}) {
    const { 
      days = 7,
      action = 'download',
      limit = 10
    } = options;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await this.findAll({
      where: {
        action,
        status: 'success',
        createdAt: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      include: [
        {
          model: sequelize.models.File,
          as: 'file',
          attributes: ['id', 'filename', 'originalName', 'mimeType', 'size']
        }
      ],
      attributes: [
        'fileId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'accessCount'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers']
      ],
      group: ['fileId', 'file.id', 'file.filename', 'file.originalName', 'file.mimeType', 'file.size'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit
    });
  };
  
  FileAccessLog.cleanupOldLogs = async function(days = 365) {
    // 1년 이상 된 로그 삭제 (보안 로그 제외)
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.lt]: cutoffDate
        },
        securityLevel: ['low', 'medium'] // 높은 보안 등급 로그는 보존
      }
    });
    
    return deletedCount;
  };
  
  // 실시간 모니터링을 위한 최근 활동 조회
  FileAccessLog.getRecentActivity = async function(minutes = 10, limit = 50) {
    const timeThreshold = new Date(Date.now() - minutes * 60 * 1000);
    
    return await this.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: timeThreshold
        }
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: sequelize.models.File,
          as: 'file',
          attributes: ['id', 'filename', 'originalName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  };
  
  return FileAccessLog;
};

// 보안 등급 결정 함수
function determineSecurityLevel(action, ipAddress) {
  // 로컬 IP는 보안 등급을 낮춤
  const isLocalIP = ipAddress.startsWith('192.168.') || 
                   ipAddress.startsWith('10.') || 
                   ipAddress.startsWith('127.') ||
                   ipAddress === '::1';
  
  if (isLocalIP) {
    return action === 'delete' ? 'medium' : 'low';
  }
  
  // 액션에 따른 보안 등급
  const actionLevels = {
    'view': 'low',
    'download': 'medium',
    'upload': 'medium',
    'share': 'medium',
    'decrypt': 'high',
    'delete': 'high'
  };
  
  return actionLevels[action] || 'medium';
}