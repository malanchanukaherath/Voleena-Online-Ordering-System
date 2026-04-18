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
                model: 'customer',
                key: 'customer_id'
            },
            field: 'customer_id'
        },
        ContactPhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'contact_phone'
        },
        VerifiedProfilePhone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'verified_profile_phone'
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
                model: 'promotion',
                key: 'promotion_id'
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
            allowNull: false,
            defaultValue: 0,
            field: 'delivery_fee'
        },
        FinalAmount: {
            type: DataTypes.VIRTUAL,
            get() {
                const totalAmount = Number(this.TotalAmount) || 0;
                const discountAmount = Number(this.DiscountAmount) || 0;
                const deliveryFee = Number(this.DeliveryFee) || 0;

                return Math.max((totalAmount - discountAmount) + deliveryFee, 0);
            }
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'CONFIRMED',
            field: 'status'
        },
        OrderType: {
            type: DataTypes.ENUM('ONLINE', 'DELIVERY', 'TAKEAWAY', 'WALK_IN'),
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
                model: 'staff',
                key: 'staff_id'
            },
            field: 'confirmed_by'
        },
        UpdatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'updated_by'
        }
    }, {
        tableName: 'order',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: false,
        // Add getter/setter to expose timestamps as PascalCase
        getterMethods: {
            CreatedAt() {
                return this.getDataValue('created_at');
            },
            UpdatedAt() {
                return this.getDataValue('updated_at');
            }
        }
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
