module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        RoleID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'role_id'
        },

        RoleName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'role_name'
        },

        Description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'description'
        }
    }, {
        tableName: 'role',
        timestamps: true,
        createdAt: 'created_at',
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
