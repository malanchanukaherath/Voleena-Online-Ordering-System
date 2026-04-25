const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PreorderRequest = sequelize.define('PreorderRequest', {
        PreorderRequestID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'preorder_request_id'
        },
        RequestNumber: {
            type: DataTypes.STRING(24),
            allowNull: false,
            unique: true,
            field: 'request_number'
        },
        CustomerID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'customer',
                key: 'customer_id'
            },
            field: 'customer_id'
        },
        ContactName: {
            type: DataTypes.STRING(120),
            allowNull: false,
            field: 'contact_name'
        },
        ContactPhone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: 'contact_phone'
        },
        ContactEmail: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'contact_email'
        },
        RequestedFor: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'requested_for'
        },
        RequestDetails: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'request_details'
        },
        AdminNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'admin_notes'
        },
        Status: {
            type: DataTypes.ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'SUBMITTED',
            field: 'status'
        },
        ApprovedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'approved_by'
        },
        ApprovedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'approved_at'
        },
        RejectedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'rejected_by'
        },
        RejectedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'rejected_at'
        },
        RejectedReason: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'rejected_reason'
        },
        LinkedOrderID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'linked_order_id'
        }
    }, {
        tableName: 'preorder_request',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    PreorderRequest.associate = (models) => {
        PreorderRequest.belongsTo(models.Customer, {
            foreignKey: 'CustomerID',
            as: 'customer'
        });
        PreorderRequest.belongsTo(models.Staff, {
            foreignKey: 'ApprovedBy',
            as: 'approver'
        });
        PreorderRequest.belongsTo(models.Staff, {
            foreignKey: 'RejectedBy',
            as: 'rejector'
        });
        PreorderRequest.belongsTo(models.Order, {
            foreignKey: 'LinkedOrderID',
            as: 'linkedOrder'
        });
        PreorderRequest.hasMany(models.PreorderRequestItem, {
            foreignKey: 'PreorderRequestID',
            as: 'items'
        });
    };

    return PreorderRequest;
};
