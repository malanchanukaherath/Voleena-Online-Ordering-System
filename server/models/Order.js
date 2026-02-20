const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
        OrderID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'order_id'
        },
        OrderNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            field: 'order_number'
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            },
            field: 'customer_id'
        },
        TotalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'total_amount'
        },
        PromotionID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Promotion',
                key: 'PromotionID'
            },
            field: 'promotion_id'
        },
        DiscountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            field: 'discount_amount'
        },
        DeliveryFee: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            field: 'delivery_fee'
        },
        FinalAmount: {
            type: DataTypes.VIRTUAL,
            get() {
                return Math.max((this.TotalAmount - this.DiscountAmount) + (this.DeliveryFee || 0), 0);
            }
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'status'
        },
        OrderType: {
            type: DataTypes.ENUM('DELIVERY', 'TAKEAWAY'),
            allowNull: false,
            field: 'order_type'
        },
        SpecialInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'special_instructions'
        },
        CancellationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'cancellation_reason'
        },
        CancelledBy: {
            type: DataTypes.ENUM('CUSTOMER', 'ADMIN', 'CASHIER', 'SYSTEM'),
            allowNull: true,
            field: 'cancelled_by'
        },
        ConfirmedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'confirmed_at'
        },
        PreparingAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'preparing_at'
        },
        ReadyAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'ready_at'
        },
        CompletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'completed_at'
        },
        CancelledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'cancelled_at'
        },
        ConfirmedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'confirmed_by'
        },
        UpdatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'updated_by'
        }
    }, {
        tableName: 'order',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
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
