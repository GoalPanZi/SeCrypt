const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const path = require('path');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Filename cannot be empty'
        }
      }
    },
    
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_name',
      validate: {
        len: {
          args: [1, 255],
          msg: 'Original name must be between 1 and 255 characters'
        }
      }
    },
    
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
      validate: {
        notEmpty: {
          msg: 'MIME type cannot be empty'
        }
      }
    },
    
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: {
          args: 0,
          msg: 'File size cannot be negative'
        },
        max: {
          args: 1024 * 1024 * 1024, // 1GB 제한
          msg: 'File size cannot exceed 1GB'
        }
      }
    },
    
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'uploaded_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // 암호화 관련
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_encrypted'
    },
    
    encryptionKeyHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'encryption_key_hash'
    },
    
    // 파일 경로 및 저장 정보
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path'
    },
    
    thumbnailPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'thumbnail_path'
    },
    
    // 파일 상태
    status: {
      type: DataTypes.ENUM('uploading', 'completed', 'failed', 'deleted'),
      defaultValue: 'uploading',
      validate: {
        isIn: {
          args: [['uploading', 'completed', 'failed', 'deleted']],
          msg: 'Status must be uploading, completed, failed, or deleted'
        }
      }
    },
    
    // 파일 메타데이터
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      // 예: { width: 1920, height: 1080, duration: 120 } for images/videos
    },
    
    // 다운로드 통계
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'download_count',
      validate: {
        min: {
          args: 0,
          msg: 'Download count cannot be negative'
        }
      }
    },
    
    // 파일 만료 설정
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    
    // 소프트 삭제
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    },
    
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
    
  }, {
    tableName: 'files',
    timestamps: true,
    
    indexes: [
      { fields: ['uploadedBy'] },
      { fields: ['mimeType'] },
      { fields: ['status'] },
      { fields: ['isDeleted'] },
      { fields: ['createdAt'] },
      { fields: ['filename'] },
      // 복합 인덱스
      { fields: ['uploadedBy', 'status'] },
      { fields: ['mimeType', 'isDeleted'] }
    ],
    
    hooks: {
      beforeCreate: async (file) => {
        // 암호화 키 해시 생성
        if (file.isEncrypted && !file.encryptionKeyHash) {
          file.encryptionKeyHash = crypto.randomBytes(32).toString('hex');
        }
        
        // 파일 확장자 검증
        const ext = path.extname(file.originalName).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.mp4', '.mp3'];
        
        if (!allowedExtensions.includes(ext)) {
          throw new Error(`File type ${ext} is not allowed`);
        }
      },
      
      beforeUpdate: (file) => {
        // 삭제 시간 업데이트
        if (file.changed('isDeleted') && file.isDeleted) {
          file.deletedAt = new Date();
        }
        
        // 상태가 완료로 변경될 때 업로드 완료 처리
        if (file.changed('status') && file.status === 'completed') {
          // 추가 처리 로직 (썸네일 생성 등)
        }
      },
      
      afterCreate: async (file) => {
        // 파일 업로드 로그 생성
        if (sequelize.models.FileAccessLog) {
          await sequelize.models.FileAccessLog.create({
            fileId: file.id,
            userId: file.uploadedBy,
            action: 'upload',
            ipAddress: null, // 컨트롤러에서 설정
            userAgent: null // 컨트롤러에서 설정
          });
        }
      }
    }
  });
  
  // 인스턴스 메서드
  File.prototype.softDelete = async function() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.status = 'deleted';
    await this.save({ fields: ['isDeleted', 'deletedAt', 'status'] });
  };
  
  File.prototype.incrementDownload = async function() {
    this.downloadCount += 1;
    await this.save({ fields: ['downloadCount'] });
  };
  
  File.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  };
  
  File.prototype.isImage = function() {
    return this.mimeType.startsWith('image/');
  };
  
  File.prototype.isVideo = function() {
    return this.mimeType.startsWith('video/');
  };
  
  File.prototype.isAudio = function() {
    return this.mimeType.startsWith('audio/');
  };
  
  File.prototype.getFormattedSize = function() {
    const bytes = parseInt(this.size);
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  File.prototype.toSafeJSON = function() {
    const file = this.toJSON();
    
    // 민감한 정보 제거
    delete file.encryptionKeyHash;
    delete file.filePath;
    
    // 삭제된 파일은 제한된 정보만 반환
    if (file.isDeleted) {
      return {
        id: file.id,
        originalName: '[삭제된 파일]',
        isDeleted: true,
        deletedAt: file.deletedAt
      };
    }
    
    return file;
  };
  
  // 클래스 메서드 (Static methods)
  File.findByUploader = async function(uploaderId, options = {}) {
    const { includeDeleted = false, limit = 50, offset = 0 } = options;
    
    const whereClause = {
      uploadedBy: uploaderId
    };
    
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }
    
    return await this.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
  };
  
  File.findByMimeType = async function(mimeType, limit = 20) {
    return await this.findAll({
      where: {
        mimeType: {
          [sequelize.Sequelize.Op.like]: `${mimeType}%`
        },
        isDeleted: false,
        status: 'completed'
      },
      order: [['createdAt', 'DESC']],
      limit
    });
  };
  
  File.getStorageStats = async function(userId = null) {
    const whereClause = {
      isDeleted: false,
      status: 'completed'
    };
    
    if (userId) {
      whereClause.uploadedBy = userId;
    }
    
    const result = await this.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalFiles'],
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize'],
        [sequelize.fn('AVG', sequelize.col('size')), 'averageSize']
      ],
      raw: true
    });
    
    return result[0];
  };
  
  File.cleanupExpired = async function() {
    const expiredFiles = await this.findAll({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        isDeleted: false
      }
    });
    
    for (const file of expiredFiles) {
      await file.softDelete();
    }
    
    return expiredFiles.length;
  };
  
  // 파일 타입별 통계
  File.getFileTypeStats = async function(userId = null) {
    const whereClause = {
      isDeleted: false,
      status: 'completed'
    };
    
    if (userId) {
      whereClause.uploadedBy = userId;
    }
    
    return await this.findAll({
      where: whereClause,
      attributes: [
        'mimeType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
      ],
      group: ['mimeType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };
  
  return File;
};