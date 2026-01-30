const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
    StaffID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'StaffID'
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

    RoleID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'RoleID'
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

    Password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Password'
    },

    IsActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'IsActive'
    },
    ProfileImageURL: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'ProfileImageURL'
    }
  }, {
    tableName: 'Staff',
    timestamps: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt'
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
