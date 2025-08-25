const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'users_email_unique',
        msg: 'Email address already exists'
      },
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        },
        len: {
          args: [5, 255],
          msg: 'Email must be between 5 and 255 characters'
        }
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Name must be between 1 and 100 characters'
        },
        notEmpty: {
          msg: 'Name cannot be empty'
        }
      },
      set(value) {
        this.setDataValue('name', value.trim());
      }
    },
    
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    
    profileImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'profile_image',
      validate: {
        isUrl: {
          msg: 'Profile image must be a valid URL'
        }
      }
    },
    
    status: {
      type: DataTypes.ENUM('online', 'offline', 'away'),
      defaultValue: 'offline',
      validate: {
        isIn: {
          args: [['online', 'offline', 'away']],
          msg: 'Status must be online, offline, or away'
        }
      }
    },
    
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_seen'
    },
    
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_verification_token'
    },
    
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_reset_token'
    },
    
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    
    encryptionKeySalt: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'encryption_key_salt'
    },
    
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'two_factor_secret'
    },
    
    profileVisibility: {
      type: DataTypes.ENUM('public', 'contacts', 'private'),
      defaultValue: 'contacts',
      field: 'profile_visibility'
    },
    
    lastSeenVisibility: {
      type: DataTypes.ENUM('everyone', 'contacts', 'nobody'),
      defaultValue: 'contacts',
      field: 'last_seen_visibility'
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    
    deactivatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deactivated_at'
    },
    
  }, {
    tableName: 'users',
    timestamps: true,
    
    indexes: [
      {
        fields: ['email']  // ✅ field 속성 없음 → 그대로 사용
      },
      {
        fields: ['status']  // ✅ field 속성 없음 → 그대로 사용
      },
      {
        fields: ['email_verified']  // ✅ 수정: emailVerified → email_verified
      },
      {
        fields: ['is_active']  // ✅ 수정: isActive → is_active
      },
      {
        fields: ['createdAt']  // ✅ timestamps 컬럼은 그대로
      }
    ],
    
    hooks: {
      beforeCreate: async (user) => {
        if (!user.encryptionKeySalt) {
          user.encryptionKeySalt = crypto.randomBytes(32).toString('hex');
        }
        
        if (!user.emailVerificationToken) {
          user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
        }
      },
      
      beforeUpdate: (user) => {
        if (user.changed('status') && user.status === 'online') {
          user.lastSeen = new Date();
        }
      },
      
      beforeBulkCreate: (users) => {
        users.forEach(user => {
          if (!user.encryptionKeySalt) {
            user.encryptionKeySalt = crypto.randomBytes(32).toString('hex');
          }
        });
      }
    }
  });
  
  // 인스턴스 메서드들은 그대로...
  User.prototype.comparePassword = async function(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.passwordHash);
    } catch (error) {
      throw new Error('Password comparison failed');
    }
  };
  
  User.prototype.generatePasswordResetToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return token;
  };
  
  User.prototype.generateEmailVerificationToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = token;
    return token;
  };
  
  User.prototype.updateLastSeen = async function() {
    this.lastSeen = new Date();
    this.status = 'online';
    await this.save({ fields: ['lastSeen', 'status'] });
  };
  
  User.prototype.setOffline = async function() {
    this.status = 'offline';
    this.lastSeen = new Date();
    await this.save({ fields: ['status', 'lastSeen'] });
  };
  
  User.prototype.toSafeJSON = function() {
    const user = this.toJSON();
    delete user.passwordHash;
    delete user.emailVerificationToken;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.encryptionKeySalt;
    delete user.twoFactorSecret;
    return user;
  };
  
  User.prototype.toPublicJSON = function() {
    const safeUser = this.toSafeJSON();
    const publicFields = ['id', 'name', 'profileImage', 'status'];
    
    if (this.profileVisibility === 'private') {
      return { id: this.id, name: this.name };
    }
    
    if (this.lastSeenVisibility === 'nobody') {
      delete safeUser.lastSeen;
    }
    
    return Object.keys(safeUser)
      .filter(key => publicFields.includes(key) || (this.profileVisibility === 'public'))
      .reduce((obj, key) => {
        obj[key] = safeUser[key];
        return obj;
      }, {});
  };
  
  // 클래스 메서드들도 그대로...
  User.hashPassword = async function(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  };
  
  User.findByEmail = async function(email) {
    return await this.findOne({ 
      where: { 
        email: email.toLowerCase().trim(),
        isActive: true 
      } 
    });
  };
  
  User.findByEmailVerificationToken = async function(token) {
    return await this.findOne({ 
      where: { 
        emailVerificationToken: token,
        emailVerified: false,
        isActive: true 
      } 
    });
  };
  
  User.findByPasswordResetToken = async function(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return await this.findOne({ 
      where: { 
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        },
        isActive: true 
      } 
    });
  };
  
  User.getOnlineUsers = async function() {
    return await this.findAll({ 
      where: { 
        status: 'online',
        isActive: true 
      },
      attributes: ['id', 'name', 'status', 'lastSeen']
    });
  };
  
  User.searchUsers = async function(query, limit = 10) {
    return await this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { name: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } },
          { email: { [sequelize.Sequelize.Op.iLike]: `%${query}%` } }
        ],
        isActive: true,
        profileVisibility: ['public', 'contacts']
      },
      attributes: ['id', 'name', 'email', 'profileImage', 'status'],
      limit
    });
  };
  
  return User;
};