const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DailyStock = sequelize.define('DailyStock', {
        StockID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'StockID'
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
        OpeningQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            },
            field: 'OpeningQuantity'
        },
        SoldQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            },
            field: 'SoldQuantity'
        },
        AdjustedQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'AdjustedQuantity'
        },
        ClosingQuantity: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.OpeningQuantity - this.SoldQuantity + this.AdjustedQuantity;
            }
        },
        UpdatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'UpdatedBy'
        }
    }, {
        tableName: 'Daily_Stock',
        timestamps: true,
        createdAt: false,
        updatedAt: 'LastUpdated',
        indexes: [
            {
                unique: true,
                fields: ['MenuItemID', 'StockDate'],
                name: 'unique_item_day'
            }
        ]
    });

    DailyStock.associate = (models) => {
        DailyStock.belongsTo(models.MenuItem, {
            foreignKey: 'MenuItemID',
            as: 'menuItem'
        });
        DailyStock.belongsTo(models.Staff, {
            foreignKey: 'UpdatedBy',
            as: 'updater'
        });
    };

    return DailyStock;
};
