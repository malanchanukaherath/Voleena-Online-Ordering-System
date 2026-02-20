const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define('Payment', {
        PaymentID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'payment_id'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Order',
                key: 'OrderID'
            },
            field: 'order_id'
        },
        Amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'amount'
        },
        Method: {
            type: DataTypes.ENUM('CASH', 'CARD', 'ONLINE', 'WALLET'),
            allowNull: false,
            field: 'method'
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'status'
        },
        TransactionID: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            field: 'transaction_id'
        },
        GatewayStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'gateway_status'
        },
        PaidAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'paid_at'
        },
        RefundedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'refunded_at'
        },
        RefundReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'refund_reason'
        }
    }, {
        tableName: 'payment',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Payment.associate = (models) => {
        Payment.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
    };

    return Payment;
};
