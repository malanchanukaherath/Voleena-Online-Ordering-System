const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        NotificationID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'NotificationID'
        },
        RecipientType: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF'),
            allowNull: false,
            field: 'RecipientType'
        },
        RecipientID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'RecipientID'
        },
        NotificationType: {
            type: DataTypes.ENUM('EMAIL', 'SMS', 'PUSH'),
            allowNull: false,
            field: 'NotificationType'
        },
        Subject: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'Subject'
        },
        Message: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'Message'
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'Status'
        },
        SentAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'SentAt'
        },
        ErrorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'ErrorMessage'
        },
        RelatedOrderID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Order',
                key: 'OrderID'
            },
            field: 'RelatedOrderID'
        }
    }, {
        tableName: 'Notification',
        timestamps: true,
        createdAt: 'CreatedAt',
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
