const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    CustomerID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'CustomerID'
    },

    Name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Name',
      validate: {
        len: {
          args: [2, 100],
          msg: 'Name must be between 2 and 100 characters'
        }
      }
    },

    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'Email',
      validate: {
        isEmail: {
          msg: 'Invalid email format'
        }
      }
    },

    Phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'Phone',
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
      field: 'ProfileImageURL'
    },

    Password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Password'
    },

    IsEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'IsEmailVerified'
    },

    IsPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'IsPhoneVerified'
    },

    AccountStatus: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),
      defaultValue: 'ACTIVE',
      field: 'AccountStatus'
    },

    PreferredNotification: {
      type: DataTypes.ENUM('EMAIL', 'SMS', 'BOTH'),
      defaultValue: 'BOTH',
      field: 'PreferredNotification'
    },

    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'IsActive'
    }
  }, {
    tableName: 'Customer',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt'
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
