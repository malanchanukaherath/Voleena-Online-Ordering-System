const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MenuItem = sequelize.define('MenuItem', {
        MenuItemID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'MenuItemID'
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
            }
        },
        CategoryID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Category',
                key: 'CategoryID'
            }
        },
        ImageURL: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'ImageURL'
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
        tableName: 'Menu_Item',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
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
