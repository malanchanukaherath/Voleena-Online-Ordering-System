const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PreorderRequestItem = sequelize.define('PreorderRequestItem', {
        PreorderRequestItemID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'preorder_request_item_id'
        },
        PreorderRequestID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'preorder_request',
                key: 'preorder_request_id'
            },
            field: 'preorder_request_id'
        },
        MenuItemID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'menu_item',
                key: 'menu_item_id'
            },
            field: 'menu_item_id'
        },
        ComboID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'combo_pack',
                key: 'combo_id'
            },
            field: 'combo_id'
        },
        RequestedName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'requested_name'
        },
        Quantity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 1,
            field: 'quantity'
        },
        Notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'notes'
        }
    }, {
        tableName: 'preorder_request_item',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    PreorderRequestItem.associate = (models) => {
        PreorderRequestItem.belongsTo(models.PreorderRequest, {
            foreignKey: 'PreorderRequestID',
            as: 'preorderRequest'
        });
        PreorderRequestItem.belongsTo(models.MenuItem, {
            foreignKey: 'MenuItemID',
            as: 'menuItem'
        });
        PreorderRequestItem.belongsTo(models.ComboPack, {
            foreignKey: 'ComboID',
            as: 'combo'
        });
    };

    return PreorderRequestItem;
};
