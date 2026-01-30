const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StockMovement = sequelize.define('StockMovement', {
        MovementID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'MovementID'
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
        StockDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'StockDate'
        },
        ChangeType: {
            type: DataTypes.ENUM('OPENING', 'SALE', 'ADJUSTMENT', 'RETURN'),
            allowNull: false,
            field: 'ChangeType'
        },
        QuantityChange: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'QuantityChange'
        },
        ReferenceID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'ReferenceID'
        },
        ReferenceType: {
            type: DataTypes.ENUM('ORDER', 'MANUAL', 'SYSTEM'),
            allowNull: true,
            field: 'ReferenceType'
        },
        Notes: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'Notes'
        },
        CreatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'CreatedBy'
        }
    }, {
        tableName: 'Stock_Movement',
        timestamps: true,
        createdAt: 'CreatedAt',
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
