const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OrderItem = sequelize.define('OrderItem', {
        OrderItemID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'OrderItemID'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Order',
                key: 'OrderID'
            },
            field: 'OrderID'
        },
        MenuItemID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Menu_Item',
                key: 'MenuItemID'
            },
            field: 'MenuItemID'
        },
        ComboID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'ComboPack',
                key: 'ComboID'
            },
            field: 'ComboID'
        },
        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            },
            field: 'Quantity'
        },
        UnitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            },
            field: 'UnitPrice'
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
            field: 'ItemNotes'
        }
    }, {
        tableName: 'Order_Item',
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
