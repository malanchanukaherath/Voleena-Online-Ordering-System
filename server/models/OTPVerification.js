const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const OTPVerification = sequelize.define('OTPVerification', {
        OTPID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'otp_id'
        },
        UserType: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF'),
            allowNull: false,
            field: 'user_type'
        },
        UserID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'user_id'
        },
        OTPHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'otp_hash'
        },
        Purpose: {
            type: DataTypes.ENUM('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN'),
            allowNull: false,
            field: 'purpose'
        },
        ExpiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at'
        },
        IsUsed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_used'
        },
        Attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'attempts'
        },
        UsedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'used_at'
        }
    }, {
        tableName: 'otp_verification',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return OTPVerification;
};
