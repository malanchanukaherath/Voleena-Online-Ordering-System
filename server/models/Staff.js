const bcrypt = require('bcryptjs');

// CODEMAP: BACKEND_SERVER_MODELS_STAFF_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const bcrypt = require('bcryptjs');

// CODEMAP: BACKEND_SERVER_MODELS_STAFF_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const bcrypt = require('bcryptjs');

// CODEMAP: BACKEND_SERVER_MODELS_STAFF_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const bcrypt = require('bcryptjs');
};
// CODEMAP: BACKEND_SERVER_MODELS_STAFF_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const bcrypt = require('bcryptjs');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
    StaffID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'staff_id'
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

    RoleID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id'
    },

    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
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

    Password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password'
    },

    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    ProfileImageURL: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'profile_image_url'
    }
  }, {
    tableName: 'staff',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Simple: This handles hash password logic.
  // Frontend connection: Defines database structure used by customer/staff/admin features.
  const hashPassword = async (staff) => {
    if (staff.changed('Password')) {
      staff.Password = await bcrypt.hash(staff.Password, 10);
    }
  };

  Staff.addHook('beforeCreate', hashPassword);
  Staff.addHook('beforeUpdate', hashPassword);

  Staff.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.Password;
    return values;
  };

  // Frontend connection: Defines database structure used by customer/staff/admin features.
  Staff.associate = function (models) {
    Staff.belongsTo(models.Role, {
      foreignKey: 'RoleID',
      as: 'role'
    });
  };

  return Staff;
};



