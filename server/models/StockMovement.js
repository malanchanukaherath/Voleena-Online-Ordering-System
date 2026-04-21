const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const StockMovement = sequelize.define('StockMovement', {
        MovementID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'movement_id'
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
        StockDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'stock_date'
        },
        ChangeType: {
            type: DataTypes.ENUM('OPENING', 'SALE', 'ADJUSTMENT', 'RETURN'),
            allowNull: false,
            field: 'change_type'
        },
        QuantityChange: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'quantity_change'
        },
        ReferenceID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'reference_id'
        },
        ReferenceType: {
            type: DataTypes.ENUM('ORDER', 'MANUAL', 'SYSTEM'),
            allowNull: true,
            field: 'reference_type'
        },
        Notes: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'notes'
        },
        CreatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'created_by'
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'created_at'
        }
    }, {
        tableName: 'stock_movement',
        timestamps: false
    });

    StockMovement.associate = (models) => {
        StockMovement.belongsTo(models.MenuItem, {
            foreignKey: 'MenuItemID',
            as: 'menuItem'
        });
        StockMovement.belongsTo(models.Staff, {
            foreignKey: 'CreatedBy',
            as: 'creator'
        });
    };

    return StockMovement;
};
