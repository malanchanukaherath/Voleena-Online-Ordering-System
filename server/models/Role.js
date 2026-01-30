module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        RoleID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'RoleID'
        },

        RoleName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'RoleName'
        },

        Description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'Description'
        },

        Permissions: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'Permissions'
        }
    }, {
        tableName: 'Role',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: false
    });

    Role.associate = function (models) {
        Role.hasMany(models.Staff, {
            foreignKey: 'RoleID',
            as: 'staff'
        });
    };

    return Role;
};
