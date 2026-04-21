const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_CATEGORY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_CATEGORY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_CATEGORY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');
};
// CODEMAP: BACKEND_SERVER_MODELS_CATEGORY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        CategoryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'category_id'
        },
        Name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'name'
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'description'
        },
        ImageURL: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'image_url'
        },
        DisplayOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'display_order'
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        }
    }, {
        tableName: 'category',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Category;
};



