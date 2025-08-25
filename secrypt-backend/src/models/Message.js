const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    content: {
      type: DataTypes.TEXT,
      allowNull: true, // 파일만 있는 메시지의 경우 null 가능
      validate: {
        len: {
          args: [0, 10000],
          msg: 'Message content cannot exceed 10000 characters'
        }
      }
    },
    
    type: {
      type: DataTypes.ENUM('text', 'file', 'image', 'system'),
      defaultValue: 'text',
      allowNull: false,
      validate: {
        isIn: {
          args: [['text', 'file', 'image', 'system']],
          msg: 'Message type must be text, file, image, or system'
        }
      }
    },
    
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'chat_id',
      references: {
        model: 'chats',
        key: 'id'
      }
    },
    
    senderId: {
      type: DataTypes.UUID,
      allowNull: true, // 시스템 메시지의 경우 null 가능
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    fileId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'file_id',
      references: {
        model: 'files',
        key: 'id'
      }
    },
    
    // 답장 기능
    replyTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reply_to',
      references: {
        model: 'messages',
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
    
    // 메시지 상태
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_edited'
    },
    
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at'
    },
    
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_deleted'
    },
    
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    },
    
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'deleted_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // 메시지 메타데이터
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      // 예: { mentions: ['userId1', 'userId2'], links: ['url1'], hashtags: ['tag1'] }
    },
    
    // 전달된 메시지 추적
    forwardedFrom: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'forwarded_from',
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    
  }, {
    tableName: 'messages',
    timestamps: true,
    
    indexes: [
      { fields: ['chat_id'] },         
      { fields: ['sender_id'] },        
      { fields: ['type'] },            
      { fields: ['is_deleted'] },       
      { fields: ['createdAt'] },         
      { fields: ['reply_to'] },          
      { fields: ['file_id'] },           
      // 복합 인덱스
      { fields: ['chat_id', 'createdAt'] },    
      { fields: ['chat_id', 'is_deleted'] }    
    ],
    
    hooks: {
      beforeCreate: async (message) => {
        // 암호화 설정이 활성화된 경우 키 해시 생성
        if (message.isEncrypted && !message.encryptionKeyHash) {
          message.encryptionKeyHash = crypto.randomBytes(16).toString('hex');
        }
        
        // 시스템 메시지는 암호화하지 않음
        if (message.type === 'system') {
          message.isEncrypted = false;
        }
      },
      
      beforeUpdate: (message) => {
        // 수정 시간 업데이트
        if (message.changed('content')) {
          message.isEdited = true;
          message.editedAt = new Date();
        }
        
        // 삭제 시간 업데이트
        if (message.changed('isDeleted') && message.isDeleted) {
          message.deletedAt = new Date();
        }
      },
      
      afterCreate: async (message) => {
        // 채팅방의 마지막 메시지 업데이트
        if (sequelize.models.Chat) {
          await sequelize.models.Chat.update(
            { 
              lastMessageId: message.id,
              lastActivity: message.createdAt 
            },
            { where: { id: message.chatId } }
          );
        }
      }
    }
  });
  
  // 인스턴스 메서드
  Message.prototype.softDelete = async function(deletedByUserId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedByUserId) {
      this.deletedBy = deletedByUserId;
    }
    await this.save({ fields: ['isDeleted', 'deletedAt', 'deletedBy'] });
  };
  
  Message.prototype.edit = async function(newContent) {
    if (this.type !== 'text') {
      throw new Error('Only text messages can be edited');
    }
    
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    await this.save({ fields: ['content', 'isEdited', 'editedAt'] });
  };
  
  Message.prototype.addReaction = async function(userId, emoji) {
    if (sequelize.models.MessageReaction) {
      return await sequelize.models.MessageReaction.create({
        messageId: this.id,
        userId: userId,
        emoji: emoji
      });
    }
    throw new Error('MessageReaction model not available');
  };
  
  Message.prototype.toSafeJSON = function() {
    const message = this.toJSON();
    
    // 민감한 정보 제거
    if (message.encryptionKeyHash) {
      delete message.encryptionKeyHash;
    }
    
    // 삭제된 메시지의 내용 숨김
    if (message.isDeleted) {
      message.content = '[삭제된 메시지입니다]';
      delete message.metadata;
    }
    
    return message;
  };
  
  // 클래스 메서드 (Static methods)
  Message.findChatMessages = async function(chatId, options = {}) {
    const { 
      limit = 50, 
      offset = 0, 
      before = null,  // 특정 시간 이전 메시지
      includeDeleted = false 
    } = options;
    
    const whereClause = {
      chatId: chatId
    };
    
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }
    
    if (before) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.lt]: before
      };
    }
    
    return await this.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: sequelize.models.File,
          as: 'file',
          attributes: ['id', 'filename', 'originalName', 'mimeType', 'size']
        },
        {
          model: sequelize.models.Message,
          as: 'repliedMessage',
          attributes: ['id', 'content', 'type'],
          include: [{
            model: sequelize.models.User,
            as: 'sender',
            attributes: ['id', 'name']
          }]
        }
      ]
    });
  };
  
  Message.searchMessages = async function(chatId, query, limit = 20) {
    return await this.findAll({
      where: {
        chatId: chatId,
        isDeleted: false,
        content: {
          [sequelize.Sequelize.Op.iLike]: `%${query}%`
        }
      },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'name']
        }
      ]
    });
  };
  
  Message.getMessageStats = async function(chatId, options = {}) {
    const { startDate, endDate } = options;
    
    const whereClause = {
      chatId: chatId,
      isDeleted: false
    };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) whereClause.createdAt[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalMessages'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN type = \'file\' THEN 1 END')), 'fileMessages'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN type = \'image\' THEN 1 END')), 'imageMessages'],
        'senderId'
      ],
      group: ['senderId'],
      raw: true
    });
    
    return stats;
  };
  
  // 시스템 메시지 생성 헬퍼
  Message.createSystemMessage = async function(chatId, content, metadata = {}) {
    return await this.create({
      content,
      type: 'system',
      chatId,
      senderId: null,
      isEncrypted: false,
      metadata
    });
  };
  
  return Message;
};