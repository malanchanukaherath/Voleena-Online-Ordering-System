const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
        HistoryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'history_id'
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
        OldStatus: {
            type: DataTypes.ENUM('PENDING', 'PREORDER_PENDING', 'PREORDER_CONFIRMED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
            allowNull: true,
            field: 'old_status'
        },
        NewStatus: {
            type: DataTypes.ENUM('PENDING', 'PREORDER_PENDING', 'PREORDER_CONFIRMED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'),
            allowNull: false,
            field: 'new_status'
        },
        ChangedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'changed_by'
        },
        ChangedByType: {
            type: DataTypes.ENUM('CUSTOMER', 'STAFF', 'SYSTEM'),
            allowNull: false,
            field: 'changed_by_type'
        },
        Notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'notes'
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'order_status_history',
        timestamps: false
    });

    OrderStatusHistory.associate = (models) => {
        OrderStatusHistory.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
        OrderStatusHistory.belongsTo(models.Staff, {
            foreignKey: 'ChangedBy',
            as: 'changer'
        });
    };

    return OrderStatusHistory;
};
