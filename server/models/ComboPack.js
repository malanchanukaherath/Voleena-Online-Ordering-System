const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ComboPack = sequelize.define('ComboPack', {
        ComboID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'ComboID'
        },
        Name: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        Price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'Price'
        },
        DiscountType: {
            type: DataTypes.ENUM('PERCENTAGE', 'FIXED_PRICE'),
            defaultValue: 'FIXED_PRICE',
            field: 'DiscountType'
        },
        DiscountValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'DiscountValue'
        },
        ImageURL: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'ImageURL'
        },
        ScheduleStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        ScheduleEndDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isAfterStart(value) {
                    if (value < this.ScheduleStartDate) {
                        throw new Error('End date must be after start date');
                    }
                }
            }
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        CreatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            }
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ComboPack',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    ComboPack.associate = (models) => {
        ComboPack.belongsTo(models.Staff, {
            foreignKey: 'CreatedBy',
            as: 'creator'
        });
        ComboPack.hasMany(models.ComboPackItem, {
            foreignKey: 'ComboID',
            as: 'items'
        });
    };

    return ComboPack;
};
