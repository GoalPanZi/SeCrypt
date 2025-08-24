const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    name: {
      type: DataTypes.STRING(255),
      allowNull: true, // direct 채팅의 경우 null 가능
      validate: {
        len: {
          args: [1, 255],
          msg: 'Chat name must be between 1 and 255 characters'
        }
      }
    },
    
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      defaultValue: 'direct',
      allowNull: false,
      validate: {
        isIn: {
          args: [['direct', 'group']],
          msg: 'Chat type must be direct or group'
        }
      }
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Description cannot exceed 1000 characters'
        }
      }
    },
    
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Avatar must be a valid URL'
        }
      }
    },
    
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
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
    
    lastMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_message_id',
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_activity'
    },
    
    // 그룹 채팅 설정
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 256,
      field: 'max_participants',
      validate: {
        min: {
          args: 2,
          msg: 'Maximum participants must be at least 2'
        },
        max: {
          args: 1000,
          msg: 'Maximum participants cannot exceed 1000'
        }
      }
    },
    
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_archived'
    },
    
    // 추가 채팅방 설정
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_public'
    },
    
    inviteCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'invite_code'
    },
    
    // 그룹 채팅 권한 설정
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        allowFileSharing: true,
        allowMemberInvite: true,
        onlyAdminCanChangeInfo: false,
        messageRetentionDays: null // null이면 무제한
      }
    }
    
  }, {
    tableName: 'chats',
    timestamps: true,
    
    indexes: [
      { fields: ['createdBy'] },
      { fields: ['type'] },
      { fields: ['lastActivity'] },
      { fields: ['isArchived'] },
      { fields: ['inviteCode'] },
      { fields: ['isPublic'] }
    ],
    
    hooks: {
      beforeCreate: async (chat) => {
        // 그룹 채팅에 초대 코드 자동 생성
        if (chat.type === 'group' && !chat.inviteCode) {
          chat.inviteCode = generateInviteCode();
        }
        
        // 암호화 설정이 활성화된 경우 키 해시 생성
        if (chat.isEncrypted && !chat.encryptionKeyHash) {
          chat.encryptionKeyHash = crypto.randomBytes(32).toString('hex');
        }
      },
      
      beforeUpdate: (chat) => {
        // 마지막 활동 시간 업데이트
        if (chat.changed('lastMessageId')) {
          chat.lastActivity = new Date();
        }
      },
      
      afterCreate: async (chat) => {
        // 채팅방 생성자를 자동으로 참가자로 추가
        if (sequelize.models.ChatParticipant) {
          await sequelize.models.ChatParticipant.create({
            chatId: chat.id,
            userId: chat.createdBy,
            role: 'admin',
            joinedAt: new Date()
          });
        }
      }
    }
  });
  
  // 인스턴스 메서드
  Chat.prototype.updateLastActivity = async function(messageId = null) {
    this.lastActivity = new Date();
    if (messageId) {
      this.lastMessageId = messageId;
    }
    await this.save({ fields: ['lastActivity', 'lastMessageId'] });
  };
  
  Chat.prototype.archive = async function() {
    this.isArchived = true;
    await this.save({ fields: ['isArchived'] });
  };
  
  Chat.prototype.unarchive = async function() {
    this.isArchived = false;
    await this.save({ fields: ['isArchived'] });
  };
  
  Chat.prototype.generateNewInviteCode = async function() {
    if (this.type !== 'group') {
      throw new Error('Invite codes are only available for group chats');
    }
    this.inviteCode = generateInviteCode();
    await this.save({ fields: ['inviteCode'] });
    return this.inviteCode;
  };
  
  Chat.prototype.updateSettings = async function(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this.save({ fields: ['settings'] });
  };
  
  Chat.prototype.toSafeJSON = function() {
    const chat = this.toJSON();
    
    // 민감한 정보는 제외
    if (chat.encryptionKeyHash) {
      delete chat.encryptionKeyHash;
    }
    
    return chat;
  };
  
  // 클래스 메서드 (Static methods)
  Chat.findByInviteCode = async function(inviteCode) {
    return await this.findOne({
      where: {
        inviteCode: inviteCode,
        type: 'group',
        isArchived: false
      }
    });
  };
  
  Chat.findUserChats = async function(userId, options = {}) {
    const { archived = false, limit = 50, offset = 0 } = options;
    
    return await this.findAll({
      include: [
        {
          model: sequelize.models.ChatParticipant,
          where: { userId: userId },
          as: 'participants'
        }
      ],
      where: {
        isArchived: archived
      },
      order: [['lastActivity', 'DESC']],
      limit,
      offset
    });
  };
  
  Chat.findDirectChat = async function(userId1, userId2) {
    // 두 사용자 간의 기존 direct 채팅 찾기
    return await this.findOne({
      where: {
        type: 'direct'
      },
      include: [
        {
          model: sequelize.models.ChatParticipant,
          as: 'participants',
          where: {
            userId: {
              [sequelize.Sequelize.Op.in]: [userId1, userId2]
            }
          }
        }
      ],
      having: sequelize.literal('COUNT("participants"."userId") = 2')
    });
  };
  
  Chat.searchPublicChats = async function(query, limit = 10) {
    return await this.findAll({
      where: {
        type: 'group',
        isPublic: true,
        isArchived: false,
        [sequelize.Sequelize.Op.or]: [
          { name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
          { description: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'description', 'avatar', 'createdAt'],
      limit
    });
  };
  
  return Chat;
};

// 유틸리티 함수
function generateInviteCode() {
  // 8자리 랜덤 초대 코드 생성
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}