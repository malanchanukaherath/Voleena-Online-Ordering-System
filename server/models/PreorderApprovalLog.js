const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PreorderApprovalLog = sequelize.define('PreorderApprovalLog', {
        PreorderApprovalLogID: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'preorder_approval_log_id'
        },
        OrderID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'order_id'
        },
        OldApprovalStatus: {
            type: DataTypes.ENUM('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'),
            allowNull: true,
            field: 'old_approval_status'
        },
        NewApprovalStatus: {
            type: DataTypes.ENUM('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'),
            allowNull: false,
            field: 'new_approval_status'
        },
        ActionBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'action_by'
        },
        ActionByType: {
            type: DataTypes.ENUM('STAFF', 'SYSTEM'),
            allowNull: false,
            defaultValue: 'STAFF',
            field: 'action_by_type'
        },
        Notes: {
            type: DataTypes.STRING(500),
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
        tableName: 'preorder_approval_log',
        timestamps: false
    });

    PreorderApprovalLog.associate = (models) => {
        PreorderApprovalLog.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
        PreorderApprovalLog.belongsTo(models.Staff, {
            foreignKey: 'ActionBy',
            as: 'actor'
        });
    };

    return PreorderApprovalLog;
};
