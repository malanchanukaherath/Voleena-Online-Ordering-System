const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OrderItem = sequelize.define('OrderItem', {
        OrderItemID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'order_item_id'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'order_id'
        },
        MenuItemID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'menu_item',
                key: 'menu_item_id'
            },
            field: 'menu_item_id'
        },
        ComboID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'combo_pack',
                key: 'combo_id'
            },
            field: 'combo_id'
        },
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            },
            field: 'quantity'
        },
        UnitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'unit_price'
        },
        Subtotal: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.Quantity * this.UnitPrice;
            }
        },
        ItemNotes: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'item_notes'
        }
    }, {
        tableName: 'order_item',
        timestamps: false,
        validate: {
            eitherMenuItemOrCombo() {
                if ((this.MenuItemID && this.ComboID) || (!this.MenuItemID && !this.ComboID)) {
                    throw new Error('Order item must have either MenuItemID or ComboID, but not both');
                }
            }
        }
    });

    OrderItem.associate = (models) => {
        OrderItem.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
        OrderItem.belongsTo(models.MenuItem, {
            foreignKey: 'MenuItemID',
            as: 'menuItem'
        });
        OrderItem.belongsTo(models.ComboPack, {
            foreignKey: 'ComboID',
            as: 'combo'
        });
    };

    return OrderItem;
};
