const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    CustomerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'customer_id'
    },

    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
      validate: {
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        }
      }
    },

    Email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'email',
      validate: {
        isEmail: {
          msg: 'Invalid email format'
        }
      }
    },

    Phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'phone',
      validate: {
        is: {
          args: /^[+]?[0-9]{9,15}$/,
          msg: 'Phone must be 9-15 digits'
        }
      }
    },

    ProfileImageURL: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_image_url'
    },

    Password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password'
    },

    IsEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified'
    },

    IsPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_phone_verified'
    },

    AccountStatus: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),
      defaultValue: 'ACTIVE',
      field: 'account_status'
    },

    PreferredNotification: {
      type: DataTypes.ENUM('EMAIL', 'SMS', 'BOTH'),
      defaultValue: 'BOTH',
      field: 'preferred_notification'
    },

    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'customer',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
//Hashing
  const hashPassword = async (customer) => {
    if (customer.changed('Password')) {
      console.log('[DEMO] 1. Plain Text Password (before hash):', customer.Password);
      customer.Password = await bcrypt.hash(customer.Password, 10);
      console.log('[DEMO] 2. Hashed Password (to be saved):', customer.Password);
    }
  };

  Customer.addHook('beforeCreate', hashPassword);
  Customer.addHook('beforeUpdate', hashPassword);

  Customer.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.Password;
    return values;
  };

  Customer.associate = function (models) {
    Customer.hasMany(models.Address, {
      foreignKey: 'CustomerID',
      as: 'addresses'
    });
  };

  return Customer;
};
