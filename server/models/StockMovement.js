const { DataTypes } = require('sequelize');

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
                model: 'MenuItem',
                key: 'MenuItemID'
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
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'created_by'
        }
    }, {
        tableName: 'stock_movement',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
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
