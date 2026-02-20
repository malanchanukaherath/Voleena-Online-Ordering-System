const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DailyStock = sequelize.define('DailyStock', {
        StockID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'stock_id'
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
        OpeningQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            },
            field: 'opening_quantity'
        },
        SoldQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            },
            field: 'sold_quantity'
        },
        AdjustedQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'adjusted_quantity'
        },
        ClosingQuantity: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.OpeningQuantity - this.SoldQuantity + this.AdjustedQuantity;
            }
        },
        Version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'version'
        },
        UpdatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'updated_by'
        },
        LastUpdated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'last_updated'
        }
    }, {
        tableName: 'daily_stock',
        timestamps: false,
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
