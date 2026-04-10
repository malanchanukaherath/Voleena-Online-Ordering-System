const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        NotificationID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'notification_id'
        },
        RecipientType: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF'),
            allowNull: false,
            field: 'recipient_type'
        },
        RecipientID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'recipient_id'
        },
        NotificationType: {
            type: DataTypes.ENUM('EMAIL', 'SMS', 'PUSH'),
            allowNull: false,
            field: 'notification_type'
        },
        Subject: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'subject'
        },
        Message: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'message'
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'status'
        },
        SentAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'sent_at'
        },
        ErrorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'error_message'
        },
        RelatedOrderID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'related_order_id'
        }
    }, {
        tableName: 'notification',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.Order, {
            foreignKey: 'RelatedOrderID',
            as: 'relatedOrder'
        });
    };

    return Notification;
};
