const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const TokenBlacklist = sequelize.define('TokenBlacklist', {
        BlacklistID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'blacklist_id'
        },
        token_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            field: 'token_hash'
        },
        user_type: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF'),
            allowNull: false,
            field: 'user_type'
        },
        user_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'user_id'
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at'
        },
        reason: {
            type: DataTypes.ENUM('LOGOUT', 'PASSWORD_CHANGE', 'SECURITY', 'ADMIN_REVOKE'),
            allowNull: false,
            defaultValue: 'LOGOUT',
            field: 'reason'
        }
    }, {
        tableName: 'token_blacklist',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return TokenBlacklist;
};
