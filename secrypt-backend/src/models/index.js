const { Sequelize } = require('sequelize');

// 모델들을 저장할 객체
const models = {};

const initializeModels = (sequelize) => {
  try {
    console.log('🔧 Initializing Sequelize models...');
    
    // 모델들 import 및 초기화
    models.User = require('./User')(sequelize);
    models.Chat = require('./Chat')(sequelize);
    models.Message = require('./Message')(sequelize);
    models.File = require('./File')(sequelize);
    models.ChatParticipant = require('./ChatParticipant')(sequelize);
    models.MessageReaction = require('./MessageReaction')(sequelize);
    models.FileAccessLog = require('./FileAccessLog')(sequelize);
    
    // 연관관계 설정
    setupAssociations(models);
    
    console.log('✅ Models initialized successfully');
    
    return models;
    
  } catch (error) {
    console.error('❌ Model initialization failed:', error.message);
    throw error;
  }
};

// 모델 간 연관관계 설정
const setupAssociations = (models) => {
  console.log('🔗 Setting up model associations...');
  
  // User 연관관계
  models.User.hasMany(models.Chat, { 
    foreignKey: 'createdBy', 
    as: 'createdChats',
    onDelete: 'CASCADE'
  });
  
  models.User.hasMany(models.Message, { 
    foreignKey: 'senderId', 
    as: 'sentMessages',
    onDelete: 'SET NULL' // 사용자 삭제 시 메시지는 유지하되 senderId만 null로
  });
  
  models.User.hasMany(models.File, { 
    foreignKey: 'uploadedBy', 
    as: 'uploadedFiles',
    onDelete: 'CASCADE'
  });
  
  models.User.belongsToMany(models.Chat, {
    through: models.ChatParticipant,
    foreignKey: 'userId',
    otherKey: 'chatId',
    as: 'chats'
  });
  
  // Chat 연관관계
  models.Chat.belongsTo(models.User, { 
    foreignKey: 'createdBy', 
    as: 'creator'
  });
  
  models.Chat.hasMany(models.Message, { 
    foreignKey: 'chatId', 
    as: 'messages',
    onDelete: 'CASCADE'
  });
  
  models.Chat.belongsToMany(models.User, {
    through: models.ChatParticipant,
    foreignKey: 'chatId',
    otherKey: 'userId',
    as: 'participants'
  });
  
  models.Chat.belongsTo(models.Message, {
    foreignKey: 'lastMessageId',
    as: 'lastMessage'
  });
  
  // Message 연관관계  
  models.Message.belongsTo(models.Chat, { 
    foreignKey: 'chatId', 
    as: 'chat'
  });
  
  models.Message.belongsTo(models.User, { 
    foreignKey: 'senderId', 
    as: 'sender'
  });
  
  models.Message.belongsTo(models.File, { 
    foreignKey: 'fileId', 
    as: 'file'
  });
  
  // 자기 참조 관계 (답장)
  models.Message.belongsTo(models.Message, { 
    foreignKey: 'replyTo', 
    as: 'repliedMessage'
  });
  
  models.Message.hasMany(models.Message, {
    foreignKey: 'replyTo',
    as: 'replies'
  });
  
  // 전달 메시지 관계
  models.Message.belongsTo(models.Message, {
    foreignKey: 'forwardedFrom',
    as: 'originalMessage'
  });
  
  models.Message.hasMany(models.Message, {
    foreignKey: 'forwardedFrom',
    as: 'forwardedMessages'
  });
  
  models.Message.hasMany(models.MessageReaction, { 
    foreignKey: 'messageId', 
    as: 'reactions',
    onDelete: 'CASCADE'
  });
  
  models.Message.belongsTo(models.User, {
    foreignKey: 'deletedBy',
    as: 'deleter'
  });
  
  // File 연관관계
  models.File.belongsTo(models.User, { 
    foreignKey: 'uploadedBy', 
    as: 'uploader'
  });
  
  models.File.hasMany(models.Message, { 
    foreignKey: 'fileId', 
    as: 'messages',
    onDelete: 'SET NULL'
  });
  
  models.File.hasMany(models.FileAccessLog, { 
    foreignKey: 'fileId', 
    as: 'accessLogs',
    onDelete: 'CASCADE'
  });
  
  // ChatParticipant 연관관계
  models.ChatParticipant.belongsTo(models.Chat, { 
    foreignKey: 'chatId', 
    as: 'chat'
  });
  
  models.ChatParticipant.belongsTo(models.User, { 
    foreignKey: 'userId', 
    as: 'user'
  });
  
  models.ChatParticipant.belongsTo(models.User, {
    foreignKey: 'invitedBy',
    as: 'inviter'
  });
  
  // MessageReaction 연관관계
  models.MessageReaction.belongsTo(models.Message, { 
    foreignKey: 'messageId', 
    as: 'message'
  });
  
  models.MessageReaction.belongsTo(models.User, { 
    foreignKey: 'userId', 
    as: 'user'
  });
  
  // FileAccessLog 연관관계
  models.FileAccessLog.belongsTo(models.File, { 
    foreignKey: 'fileId', 
    as: 'file'
  });
  
  models.FileAccessLog.belongsTo(models.User, { 
    foreignKey: 'userId', 
    as: 'user'
  });
  
  console.log('✅ Model associations set up successfully');
};

// 모델 정의 검증
const validateModels = () => {
  const requiredModels = [
    'User', 'Chat', 'Message', 'File', 
    'ChatParticipant', 'MessageReaction', 'FileAccessLog'
  ];
  
  const missingModels = requiredModels.filter(modelName => !models[modelName]);
  
  if (missingModels.length > 0) {
    throw new Error(`Missing models: ${missingModels.join(', ')}`);
  }
  
  console.log('✅ All required models are present');
};

// 모델 상태 확인
const getModelStatus = () => {
  return Object.keys(models).reduce((status, modelName) => {
    const model = models[modelName];
    status[modelName] = {
      tableName: model.tableName,
      attributes: Object.keys(model.rawAttributes).length,
      associations: Object.keys(model.associations).length,
      hooks: Object.keys(model.options.hooks || {}).length
    };
    return status;
  }, {});
};

// 데이터베이스 동기화
const syncModels = async (sequelize, options = {}) => {
  try {
    const {
      force = false,
      alter = false,
      logging = false
    } = options;
    
    console.log('🔄 Synchronizing database models...');
    
    // 개발 환경에서만 동기화 수행
    if (process.env.NODE_ENV !== 'production') {
      const syncOptions = {
        force,
        alter,
        logging
      };
      
      await sequelize.sync(syncOptions);
      console.log('✅ Database synchronization completed');
    } else {
      console.log('⚠️ Skipping sync in production environment');
    }
    
  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message);
    throw error;
  }
};

// 모델 헬퍼 메서드들
const modelHelpers = {
  // 모든 모델 목록 반환
  getModelNames: () => Object.keys(models),
  
  // 특정 모델 반환
  getModel: (modelName) => models[modelName],
  
  // 모델 존재 여부 확인
  hasModel: (modelName) => !!models[modelName],
  
  // 모델 상태 정보
  getStatus: getModelStatus,
  
  // 연관관계 정보 반환
  getAssociations: (modelName) => {
    const model = models[modelName];
    return model ? model.associations : null;
  }
};

module.exports = {
  initializeModels,
  setupAssociations,
  validateModels,
  syncModels,
  modelHelpers,
  models // 직접 접근용
};