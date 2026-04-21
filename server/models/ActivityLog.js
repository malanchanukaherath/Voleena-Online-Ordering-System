const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        LogID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'log_id'
        },
        UserType: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF', 'SYSTEM'),
            allowNull: false,
            field: 'user_type'
        },
        UserID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'user_id'
        },
        Action: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'action'
        },
        EntityType: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'entity_type'
        },
        EntityID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'entity_id'
        },
        Details: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'details'
        },
        IPAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
            field: 'ip_address'
        },
        UserAgent: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'user_agent'
        }
    }, {
        tableName: 'activity_log',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return ActivityLog;
};
