const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ComboPackItem = sequelize.define('ComboPackItem', {
        ComboPackItemID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ComboID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'ComboPack',
                key: 'ComboID'
            },
            field: 'ComboID'
        },
        MenuItemID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Menu_Item',
                key: 'MenuItemID'
            },
            field: 'MenuItemID'
        },
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        }
    }, {
        tableName: 'ComboPackItem',
        timestamps: false
    });

    ComboPackItem.associate = (models) => {
        ComboPackItem.belongsTo(models.ComboPack, {
            foreignKey: 'ComboID',
            as: 'comboPack'
        });
        ComboPackItem.belongsTo(models.MenuItem, {
            foreignKey: 'MenuItemID',
            as: 'menuItem'
        });
    };

    return ComboPackItem;
};
