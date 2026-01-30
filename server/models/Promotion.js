const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Promotion = sequelize.define('Promotion', {
        PromotionID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'PromotionID'
        },
        Code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: 'Code'
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Description'
        },
        DiscountType: {
            type: DataTypes.ENUM('PERCENTAGE', 'FIXED_AMOUNT'),
            allowNull: false,
            field: 'DiscountType'
        },
        DiscountValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'DiscountValue'
        },
        MinOrderAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
            field: 'MinOrderAmount'
        },
        MaxDiscountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'MaxDiscountAmount'
        },
        ValidFrom: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'ValidFrom'
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
            field: 'ValidUntil'
        },
        UsageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'UsageLimit'
        },
        UsageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'UsageCount'
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'IsActive'
        },
        CreatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'CreatedBy'
        }
    }, {
        tableName: 'Promotion',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Promotion.associate = (models) => {
        Promotion.belongsTo(models.Staff, {
            foreignKey: 'CreatedBy',
            as: 'creator'
        });
    };

    return Promotion;
};
