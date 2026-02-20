const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Promotion = sequelize.define('Promotion', {
        PromotionID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'promotion_id'
        },
        Code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'code'
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'description'
        },
        DiscountType: {
            type: DataTypes.ENUM('PERCENTAGE', 'FIXED_AMOUNT'),
            allowNull: false,
            field: 'discount_type'
        },
        DiscountValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'discount_value'
        },
        MinOrderAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            field: 'min_order_amount'
        },
        MaxDiscountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'max_discount_amount'
        },
        ValidFrom: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'valid_from'
        },
        ValidUntil: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfterValidFrom(value) {
                    if (value < this.ValidFrom) {
                        throw new Error('ValidUntil must be after ValidFrom');
                    }
                }
            },
            field: 'valid_until'
        },
        UsageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'usage_limit'
        },
        UsageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'usage_count'
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        CreatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'created_by'
        }
    }, {
        tableName: 'promotion',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Promotion.associate = (models) => {
        Promotion.belongsTo(models.Staff, {
            foreignKey: 'CreatedBy',
            as: 'creator'
        });
    };

    return Promotion;
};
