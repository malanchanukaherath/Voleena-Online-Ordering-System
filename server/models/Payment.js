const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define('Payment', {
        PaymentID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'PaymentID'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Order',
                key: 'OrderID'
            },
            field: 'OrderID'
        },
        Amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'Amount'
        },
        Method: {
            type: DataTypes.ENUM('CASH', 'CARD', 'ONLINE', 'WALLET'),
            allowNull: false,
            field: 'Method'
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'Status'
        },
        TransactionID: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            field: 'TransactionID'
        },
        PaymentGatewayResponse: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'PaymentGatewayResponse'
        },
        PaidAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'PaidAt'
        },
        RefundedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'RefundedAt'
        },
        RefundReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'RefundReason'
        }
    }, {
        tableName: 'Payment',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Payment.associate = (models) => {
        Payment.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
    };

    return Payment;
};
