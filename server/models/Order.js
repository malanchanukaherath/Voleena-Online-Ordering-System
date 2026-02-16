const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
        OrderID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'OrderID'
        },
        OrderNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            field: 'OrderNumber'
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            },
            field: 'CustomerID'
        },
        TotalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'TotalAmount'
        },
        PromotionID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Promotion',
                key: 'PromotionID'
            },
            field: 'PromotionID'
        },
        DiscountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            field: 'DiscountAmount'
        },
        FinalAmount: {
            type: DataTypes.VIRTUAL,
            get() {
                return Math.max(this.TotalAmount - this.DiscountAmount, 0);
            }
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'Status'
        },
        OrderType: {
            type: DataTypes.ENUM('DELIVERY', 'TAKEAWAY'),
            allowNull: false,
            field: 'OrderType'
        },
        SpecialInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'SpecialInstructions'
        },
        CancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'CancellationReason'
        },
        CancelledBy: {
            type: DataTypes.ENUM('CUSTOMER', 'ADMIN', 'CASHIER', 'SYSTEM'),
            allowNull: true,
            field: 'CancelledBy'
        },
        ConfirmedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'ConfirmedAt'
        },
        PreparingAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'PreparingAt'
        },
        ReadyAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'ReadyAt'
        },
        CompletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'CompletedAt'
        },
        CancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'CancelledAt'
        },
        ConfirmedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'ConfirmedBy'
        }
    }, {
        tableName: 'Order',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Order.associate = (models) => {
        Order.belongsTo(models.Customer, {
            foreignKey: 'CustomerID',
            as: 'customer'
        });
        Order.belongsTo(models.Promotion, {
            foreignKey: 'PromotionID',
            as: 'promotion'
        });
        Order.belongsTo(models.Staff, {
            foreignKey: 'ConfirmedBy',
            as: 'confirmer'
        });
        Order.hasMany(models.OrderItem, {
            foreignKey: 'OrderID',
            as: 'items'
        });
        Order.hasOne(models.Payment, {
            foreignKey: 'OrderID',
            as: 'payment'
        });
        Order.hasOne(models.Delivery, {
            foreignKey: 'OrderID',
            as: 'delivery'
        });
    };

    return Order;
};
