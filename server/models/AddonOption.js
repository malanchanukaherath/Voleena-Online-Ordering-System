const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AddonOption = sequelize.define('AddonOption', {
        AddOnOptionID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'addon_option_id'
        },
        Code: {
            type: DataTypes.STRING(80),
            allowNull: true,
            unique: true,
            field: 'code'
        },
        Name: {
            type: DataTypes.STRING(120),
            allowNull: false,
            field: 'name'
        },
        Description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'description'
        },
        PriceDelta: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            field: 'price_delta'
        },
        DefaultMaxQty: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
            field: 'default_max_qty'
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_active'
        },
        AffectsLiveStock: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'affects_live_stock'
        },
        DisplayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'display_order'
        },
        AddonGroup: {
            type: DataTypes.STRING(80),
            allowNull: true,
            field: 'addon_group'
        },
        CreatedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'created_by'
        },
        UpdatedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'updated_by'
        }
    }, {
        tableName: 'addon_option',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    AddonOption.associate = (models) => {
        AddonOption.belongsTo(models.Staff, {
            foreignKey: 'CreatedBy',
            as: 'createdByStaff'
        });

        AddonOption.belongsTo(models.Staff, {
            foreignKey: 'UpdatedBy',
            as: 'updatedByStaff'
        });

        AddonOption.hasMany(models.MenuItemAddonOption, {
            foreignKey: 'AddOnOptionID',
            as: 'menuAssignments'
        });

        AddonOption.hasMany(models.AddonOptionAudit, {
            foreignKey: 'AddOnOptionID',
            as: 'auditLogs'
        });
    };

    return AddonOption;
};
