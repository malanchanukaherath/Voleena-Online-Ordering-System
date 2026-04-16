const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MenuItem = sequelize.define('MenuItem', {
        MenuItemID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'menu_item_id'
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
        CategoryID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Category',
                key: 'CategoryID'
            },
            field: 'category_id'
        },
        ImageURL: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'image_url'
        },
        IsActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },
        IsAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_available'
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
        
    }, {
        tableName: 'menu_item',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    MenuItem.associate = (models) => {
        MenuItem.belongsTo(models.Category, {
            foreignKey: 'CategoryID',
            as: 'category'
        });
        MenuItem.belongsTo(models.Staff, {
            foreignKey: 'CreatedBy',
            as: 'creator'
        });
    };

    return MenuItem;
};
