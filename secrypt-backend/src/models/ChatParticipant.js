const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatParticipant = sequelize.define('ChatParticipant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // 참가자 역할
    role: {
      type: DataTypes.ENUM('member', 'admin', 'owner'),
      defaultValue: 'member',
      validate: {
        isIn: {
          args: [['member', 'admin', 'owner']],
          msg: 'Role must be member, admin, or owner'
        }
      }
    },
    
    // 참여 시간
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    },
    
    // 초대자
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'invited_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // 나간 시간 (소프트 삭제 대신 사용)
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'left_at'
    },
    
    // 알림 설정
    notificationSettings: {
      type: DataTypes.JSON,
      defaultValue: {
        mentions: true,      // 멘션 알림
        allMessages: true,   // 모든 메시지 알림
        files: true,         // 파일 공유 알림
        systemMessages: true // 시스템 메시지 알림
      },
      field: 'notification_settings'
    },
    
    // 권한 설정
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        canInviteMembers: false,    // 멤버 초대 권한
        canRemoveMembers: false,    // 멤버 제거 권한
        canEditChatInfo: false,     // 채팅방 정보 수정 권한
        canDeleteMessages: false,   // 메시지 삭제 권한
        canPinMessages: false,      // 메시지 고정 권한
        canManageFiles: false       // 파일 관리 권한
      }
    },
    
    // 마지막 읽은 메시지
    lastReadMessageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_read_message_id',
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    
    // 마지막 활동 시간
    lastActiveAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_active_at'
    },
    
    // 음소거 설정
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_muted'
    },
    
    mutedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'muted_until'
    },
    
    // 즐겨찾기 설정
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_favorite'
    }
    
  }, {
    tableName: 'chat_participants',
    timestamps: true,
    
    indexes: [
      // 중복 참가 방지
      { 
        fields: ['chat_id', 'user_id'], 
        unique: true,
        name: 'unique_chat_user'
      },
      { fields: ['chat_id'] },
      { fields: ['user_id'] },
      { fields: ['role'] },
      { fields: ['joined_at'] },
      { fields: ['left_at'] },
      { fields: ['last_active_at'] },
      // 복합 인덱스
      { fields: ['chat_id', 'role'] },
      { fields: ['user_id', 'is_favorite'] }
    ],
    
    hooks: {
      beforeCreate: async (participant) => {
        // owner 역할은 채팅방당 하나만 존재
        if (participant.role === 'owner') {
          const existingOwner = await ChatParticipant.findOne({
            where: {
              chatId: participant.chatId,
              role: 'owner',
              leftAt: null
            }
          });
          
          if (existingOwner) {
            throw new Error('A chat can only have one owner');
          }
        }
        
        // 권한 설정 (역할에 따른 기본 권한)
        participant.permissions = getDefaultPermissions(participant.role);
      },
      
      beforeUpdate: (participant) => {
        // 역할 변경 시 권한 재설정
        if (participant.changed('role')) {
          participant.permissions = {
            ...participant.permissions,
            ...getDefaultPermissions(participant.role)
          };
        }
        
        // 음소거 해제 확인
        if (participant.mutedUntil && new Date() > participant.mutedUntil) {
          participant.isMuted = false;
          participant.mutedUntil = null;
        }
      },
      
      afterCreate: async (participant) => {
        // 채팅방 참가자 수 업데이트를 위한 시스템 메시지 생성
        if (sequelize.models.Message && sequelize.models.User) {
          const user = await sequelize.models.User.findByPk(participant.userId);
          if (user) {
            await sequelize.models.Message.createSystemMessage(
              participant.chatId,
              `${user.name}님이 채팅방에 참여했습니다.`,
              { 
                type: 'user_joined',
                userId: participant.userId,
                invitedBy: participant.invitedBy
              }
            );
          }
        }
      }
    }
  });
  
  // 인스턴스 메서드
  ChatParticipant.prototype.leaveChat = async function() {
    this.leftAt = new Date();
    await this.save({ fields: ['leftAt'] });
    
    // 퇴장 시스템 메시지 생성
    if (sequelize.models.Message && sequelize.models.User) {
      const user = await sequelize.models.User.findByPk(this.userId);
      if (user) {
        await sequelize.models.Message.createSystemMessage(
          this.chatId,
          `${user.name}님이 채팅방을 나갔습니다.`,
          { 
            type: 'user_left',
            userId: this.userId
          }
        );
      }
    }
  };
  
  ChatParticipant.prototype.promoteToAdmin = async function() {
    if (this.role === 'member') {
      this.role = 'admin';
      await this.save({ fields: ['role'] });
    }
  };
  
  ChatParticipant.prototype.demoteToMember = async function() {
    if (this.role === 'admin') {
      this.role = 'member';
      await this.save({ fields: ['role'] });
    }
  };
  
  ChatParticipant.prototype.updateLastRead = async function(messageId) {
    this.lastReadMessageId = messageId;
    this.lastActiveAt = new Date();
    await this.save({ fields: ['lastReadMessageId', 'lastActiveAt'] });
  };
  
  ChatParticipant.prototype.muteChat = async function(duration = null) {
    this.isMuted = true;
    if (duration) {
      this.mutedUntil = new Date(Date.now() + duration);
    }
    await this.save({ fields: ['isMuted', 'mutedUntil'] });
  };
  
  ChatParticipant.prototype.unmuteChat = async function() {
    this.isMuted = false;
    this.mutedUntil = null;
    await this.save({ fields: ['isMuted', 'mutedUntil'] });
  };
  
  ChatParticipant.prototype.toggleFavorite = async function() {
    this.isFavorite = !this.isFavorite;
    await this.save({ fields: ['isFavorite'] });
  };
  
  ChatParticipant.prototype.updateNotificationSettings = async function(settings) {
    this.notificationSettings = {
      ...this.notificationSettings,
      ...settings
    };
    await this.save({ fields: ['notificationSettings'] });
  };
  
  ChatParticipant.prototype.hasPermission = function(permission) {
    return this.permissions[permission] === true;
  };
  
  ChatParticipant.prototype.isActive = function() {
    return this.leftAt === null;
  };
  
  ChatParticipant.prototype.isMutedNow = function() {
    if (!this.isMuted) return false;
    if (!this.mutedUntil) return true;
    return new Date() < this.mutedUntil;
  };
  
  // 클래스 메서드 (Static methods)
  ChatParticipant.findChatParticipants = async function(chatId, options = {}) {
    const { includeLeft = false, role = null } = options;
    
    const whereClause = { chatId };
    
    if (!includeLeft) {
      whereClause.leftAt = null;
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'profileImage', 'status', 'lastSeen']
        },
        {
          model: sequelize.models.User,
          as: 'inviter',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['role', 'ASC'], // owner, admin, member 순
        ['joinedAt', 'ASC']
      ]
    });
  };
  
  ChatParticipant.findUserChats = async function(userId, options = {}) {
    const { includeLeft = false, onlyFavorites = false, limit = 50 } = options;
    
    const whereClause = { userId };
    
    if (!includeLeft) {
      whereClause.leftAt = null;
    }
    
    if (onlyFavorites) {
      whereClause.isFavorite = true;
    }
    
    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Chat,
          as: 'chat',
          include: [
            {
              model: sequelize.models.User,
              as: 'creator',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['lastActiveAt', 'DESC']],
      limit
    });
  };
  
  ChatParticipant.getChatAdmins = async function(chatId) {
    return await this.findAll({
      where: {
        chatId,
        role: ['admin', 'owner'],
        leftAt: null
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
  };
  
  ChatParticipant.isUserInChat = async function(userId, chatId) {
    const participant = await this.findOne({
      where: {
        userId,
        chatId,
        leftAt: null
      }
    });
    
    return !!participant;
  };
  
  ChatParticipant.getUserRole = async function(userId, chatId) {
    const participant = await this.findOne({
      where: {
        userId,
        chatId,
        leftAt: null
      },
      attributes: ['role']
    });
    
    return participant ? participant.role : null;
  };
  
  ChatParticipant.getUnreadCount = async function(userId, chatId) {
    const participant = await this.findOne({
      where: {
        userId,
        chatId,
        leftAt: null
      }
    });
    
    if (!participant || !participant.lastReadMessageId) {
      // 읽은 메시지가 없으면 전체 메시지 수 반환
      return await sequelize.models.Message.count({
        where: {
          chatId,
          isDeleted: false
        }
      });
    }
    
    // 마지막으로 읽은 메시지 이후의 메시지 수
    const lastReadMessage = await sequelize.models.Message.findByPk(
      participant.lastReadMessageId
    );
    
    if (!lastReadMessage) return 0;
    
    return await sequelize.models.Message.count({
      where: {
        chatId,
        createdAt: {
          [sequelize.Sequelize.Op.gt]: lastReadMessage.createdAt
        },
        isDeleted: false
      }
    });
  };
  
  return ChatParticipant;
};

// 역할별 기본 권한 설정
function getDefaultPermissions(role) {
  const permissions = {
    member: {
      canInviteMembers: false,
      canRemoveMembers: false,
      canEditChatInfo: false,
      canDeleteMessages: false,
      canPinMessages: false,
      canManageFiles: false
    },
    admin: {
      canInviteMembers: true,
      canRemoveMembers: true,
      canEditChatInfo: true,
      canDeleteMessages: true,
      canPinMessages: true,
      canManageFiles: true
    },
    owner: {
      canInviteMembers: true,
      canRemoveMembers: true,
      canEditChatInfo: true,
      canDeleteMessages: true,
      canPinMessages: true,
      canManageFiles: true
    }
  };
  
  return permissions[role] || permissions.member;
}