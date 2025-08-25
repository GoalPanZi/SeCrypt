const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageReaction = sequelize.define('MessageReaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'message_id',
      references: {
        model: 'messages',
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
    
    emoji: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Emoji cannot be empty'
        },
        len: {
          args: [1, 20],
          msg: 'Emoji must be between 1 and 20 characters'
        },
        isValidEmoji(value) {
          // 기본 이모지 또는 유니코드 이모지 검증
          const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;
          const allowedEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥', '💯'];
          
          if (!emojiRegex.test(value) && !allowedEmojis.includes(value)) {
            throw new Error('Invalid emoji format');
          }
        }
      }
    },
    
    // 반응 타입 (일반, 강조 등)
    reactionType: {
      type: DataTypes.ENUM('like', 'love', 'laugh', 'angry', 'sad', 'wow', 'custom'),
      defaultValue: 'custom',
      field: 'reaction_type',
      validate: {
        isIn: {
          args: [['like', 'love', 'laugh', 'angry', 'sad', 'wow', 'custom']],
          msg: 'Reaction type must be like, love, laugh, angry, sad, wow, or custom'
        }
      }
    }
    
  }, {
    tableName: 'message_reactions',
    timestamps: true,
    
    indexes: [
      // 중복 반응 방지 (같은 사용자가 같은 메시지에 같은 이모지로 반응 불가)
      { 
        fields: ['message_id', 'user_id', 'emoji'], 
        unique: true,
        name: 'unique_message_user_emoji'
      },
      { fields: ['message_id'] },
      { fields: ['user_id'] },
      { fields: ['emoji'] },
      { fields: ['reaction_type'] },
      { fields: ['createdAt'] },
      // 복합 인덱스
      { fields: ['message_id', 'emoji'] },
      { fields: ['message_id', 'reaction_type'] }
    ],
    
    hooks: {
      beforeCreate: async (reaction) => {
        // 메시지 존재 여부 확인
        if (sequelize.models.Message) {
          const message = await sequelize.models.Message.findByPk(reaction.messageId);
          if (!message) {
            throw new Error('Message not found');
          }
          
          // 삭제된 메시지에는 반응 불가
          if (message.isDeleted) {
            throw new Error('Cannot react to deleted message');
          }
        }
        
        // 반응 타입 자동 설정
        reaction.reactionType = getReactionType(reaction.emoji);
      },
      
      beforeUpdate: (reaction) => {
        // 이모지 변경 시 반응 타입 재설정
        if (reaction.changed('emoji')) {
          reaction.reactionType = getReactionType(reaction.emoji);
        }
      },
      
      afterCreate: async (reaction) => {
        // 실시간 알림을 위한 이벤트 발생 (WebSocket 등에서 사용)
        // socketService에서 처리할 예정
      },
      
      afterDestroy: async (reaction) => {
        // 반응 삭제 시 실시간 알림
      }
    }
  });
  
  // 인스턴스 메서드
  MessageReaction.prototype.toggle = async function() {
    // 같은 반응이 이미 있으면 삭제, 없으면 생성
    await this.destroy();
  };
  
  MessageReaction.prototype.toSafeJSON = function() {
    const reaction = this.toJSON();
    return {
      id: reaction.id,
      emoji: reaction.emoji,
      reactionType: reaction.reactionType,
      userId: reaction.userId,
      createdAt: reaction.createdAt
    };
  };
  
  // 클래스 메서드 (Static methods)
  MessageReaction.addReaction = async function(messageId, userId, emoji) {
    try {
      // 중복 반응 확인 및 처리
      const existingReaction = await this.findOne({
        where: {
          messageId,
          userId,
          emoji
        }
      });
      
      if (existingReaction) {
        // 이미 같은 반응이 있으면 제거
        await existingReaction.destroy();
        return null;
      } else {
        // 새로운 반응 생성
        return await this.create({
          messageId,
          userId,
          emoji
        });
      }
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        // 동시성 문제로 인한 중복 생성 시도 처리
        return null;
      }
      throw error;
    }
  };
  
  MessageReaction.removeReaction = async function(messageId, userId, emoji = null) {
    const whereClause = {
      messageId,
      userId
    };
    
    if (emoji) {
      whereClause.emoji = emoji;
    }
    
    const reactions = await this.findAll({ where: whereClause });
    
    for (const reaction of reactions) {
      await reaction.destroy();
    }
    
    return reactions.length;
  };
  
  MessageReaction.getMessageReactions = async function(messageId, options = {}) {
    const { includeUsers = false } = options;
    
    const queryOptions = {
      where: { messageId },
      order: [['createdAt', 'ASC']]
    };
    
    if (includeUsers) {
      queryOptions.include = [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'profileImage']
        }
      ];
    }
    
    return await this.findAll(queryOptions);
  };
  
  MessageReaction.getReactionStats = async function(messageId) {
    return await this.findAll({
      where: { messageId },
      attributes: [
        'emoji',
        'reactionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['emoji', 'reactionType'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };
  
  MessageReaction.getUserReactions = async function(userId, options = {}) {
    const { chatId = null, limit = 50, offset = 0 } = options;
    
    const queryOptions = {
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.Message,
          as: 'message',
          attributes: ['id', 'content', 'type', 'chatId'],
          include: [
            {
              model: sequelize.models.Chat,
              as: 'chat',
              attributes: ['id', 'name', 'type']
            }
          ]
        }
      ]
    };
    
    if (chatId) {
      queryOptions.include[0].where = { chatId };
    }
    
    return await this.findAll(queryOptions);
  };
  
  MessageReaction.getPopularEmojis = async function(options = {}) {
    const { chatId = null, startDate = null, endDate = null, limit = 10 } = options;
    
    const whereClause = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) whereClause.createdAt[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    const queryOptions = {
      where: whereClause,
      attributes: [
        'emoji',
        [sequelize.fn('COUNT', sequelize.col('id')), 'usage_count']
      ],
      group: ['emoji'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit,
      raw: true
    };
    
    if (chatId) {
      queryOptions.include = [
        {
          model: sequelize.models.Message,
          as: 'message',
          where: { chatId },
          attributes: []
        }
      ];
    }
    
    return await this.findAll(queryOptions);
  };
  
  MessageReaction.cleanupOrphanedReactions = async function() {
    // 삭제된 메시지에 대한 반응들 정리
    const orphanedReactions = await this.findAll({
      include: [
        {
          model: sequelize.models.Message,
          as: 'message',
          where: { isDeleted: true }
        }
      ]
    });
    
    for (const reaction of orphanedReactions) {
      await reaction.destroy();
    }
    
    return orphanedReactions.length;
  };
  
  // 메시지별 반응 요약 정보
  MessageReaction.getMessageReactionSummary = async function(messageId) {
    const reactions = await this.getReactionStats(messageId);
    
    const summary = {
      total: 0,
      emojis: {},
      types: {}
    };
    
    reactions.forEach(reaction => {
      const count = parseInt(reaction.count);
      summary.total += count;
      summary.emojis[reaction.emoji] = count;
      
      if (summary.types[reaction.reactionType]) {
        summary.types[reaction.reactionType] += count;
      } else {
        summary.types[reaction.reactionType] = count;
      }
    });
    
    return summary;
  };
  
  return MessageReaction;
};

// 이모지에 따른 반응 타입 매핑
function getReactionType(emoji) {
  const emojiTypeMap = {
    '👍': 'like',
    '👎': 'like',
    '❤️': 'love',
    '💕': 'love',
    '💖': 'love',
    '😂': 'laugh',
    '🤣': 'laugh',
    '😆': 'laugh',
    '😡': 'angry',
    '😠': 'angry',
    '🤬': 'angry',
    '😢': 'sad',
    '😭': 'sad',
    '😰': 'sad',
    '😮': 'wow',
    '😲': 'wow',
    '🤯': 'wow'
  };
  
  return emojiTypeMap[emoji] || 'custom';
}