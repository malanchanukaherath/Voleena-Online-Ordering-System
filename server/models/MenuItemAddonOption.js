const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_MENUITEMADDONOPTION_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_MENUITEMADDONOPTION_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_MENUITEMADDONOPTION_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');
};
// CODEMAP: BACKEND_SERVER_MODELS_MENUITEMADDONOPTION_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const MenuItemAddonOption = sequelize.define('MenuItemAddonOption', {
        MenuItemAddonOptionID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'menu_item_addon_option_id'
        },
        MenuItemID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'menu_item_id'
        },
        AddOnOptionID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'addon_option_id'
        },
        IsRequired: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_required'
        },
        MaxQty: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
            field: 'max_qty'
        },
        DisplayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'display_order'
        },
        IsDefault: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_default'
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'menu_item_addon_option',
        timestamps: false
    });

    MenuItemAddonOption.associate = (models) => {
        MenuItemAddonOption.belongsTo(models.MenuItem, {
            foreignKey: 'MenuItemID',
            as: 'menuItem'
        });

        MenuItemAddonOption.belongsTo(models.AddonOption, {
            foreignKey: 'AddOnOptionID',
            as: 'addOnOption'
        });
    };

    return MenuItemAddonOption;
};



