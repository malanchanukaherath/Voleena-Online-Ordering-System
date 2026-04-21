const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const ComboPack = sequelize.define('ComboPack', {
        ComboID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'combo_id'
        },
        Name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            field: 'name'
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'description'
        },
        Price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'price'
        },
        DiscountType: {
            type: DataTypes.ENUM('PERCENTAGE', 'FIXED_PRICE'),
            defaultValue: 'FIXED_PRICE',
            field: 'discount_type'
        },
        DiscountValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'discount_value'
        },
        ImageURL: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'image_url'
        },
        ScheduleStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'schedule_start_date'
        },
        ScheduleEndDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                // This checks that the end date is not before the start date.
                isAfterStart(value) {
                    if (value < this.ScheduleStartDate) {
                        throw new Error('End date must be after start date');
                    }
                }
            },
            field: 'schedule_end_date'
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
        },
        CreatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }
    }, {
        tableName: 'combo_pack',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
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
