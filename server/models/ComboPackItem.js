const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ComboPackItem = sequelize.define('ComboPackItem', {
        ComboPackItemID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'combo_pack_item_id'
        },
        ComboID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'combo_pack',
                key: 'combo_id'
            },
            field: 'combo_id'
        },
        MenuItemID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'menu_item',
                key: 'menu_item_id'
            },
            field: 'menu_item_id'
        },
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            },
            field: 'quantity'
        }
    }, {
        tableName: 'combo_pack_item',
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
