const bcrypt = require('bcryptjs');

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

  Staff.associate = function (models) {
    Staff.belongsTo(models.Role, {
      foreignKey: 'RoleID',
      as: 'role'
    });
  };

  return Staff;
};
