const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const AppNotification = sequelize.define('AppNotification', {
        AppNotificationID: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'app_notification_id'
        },
        RecipientType: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF'),
            allowNull: false,
            field: 'recipient_type'
        },
        RecipientID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'recipient_id'
        },
        RecipientRole: {
            type: DataTypes.ENUM('CUSTOMER', 'ADMIN', 'CASHIER', 'KITCHEN', 'DELIVERY', 'STAFF'),
            allowNull: true,
            field: 'recipient_role'
        },
        EventType: {
            type: DataTypes.STRING(64),
            allowNull: false,
            field: 'event_type'
        },
        Title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'title'
        },
        Message: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'message'
        },
        PayloadJSON: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'payload_json'
        },
        Priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
            allowNull: false,
            defaultValue: 'MEDIUM',
            field: 'priority'
        },
        IsRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_read'
        },
        ReadAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'read_at'
        },
        RelatedOrderID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'related_order_id'
        },
        DedupeKey: {
            type: DataTypes.STRING(191),
            allowNull: true,
            unique: true,
            field: 'dedupe_key'
        }
    }, {
        tableName: 'app_notification',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    AppNotification.associate = (models) => {
        AppNotification.belongsTo(models.Order, {
            foreignKey: 'RelatedOrderID',
            as: 'relatedOrder'
        });
    };

    return AppNotification;
};
