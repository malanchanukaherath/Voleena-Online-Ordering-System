const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const Feedback = sequelize.define('Feedback', {
        FeedbackID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'feedback_id'
        },
        Rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            field: 'rating'
        },
        Comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'comment'
        },
        CustomerID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'customer',
                key: 'customer_id'
            },
            field: 'customer_id'
        },
        OrderID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'order_id'
        },
        FeedbackType: {
            type: DataTypes.ENUM('ORDER', 'DELIVERY', 'GENERAL'),
            defaultValue: 'ORDER',
            field: 'feedback_type'
        },
        AdminResponse: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'admin_response'
        },
        RespondedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'responded_at'
        },
        RespondedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'responded_by'
        }
    }, {
        tableName: 'feedback',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    Feedback.associate = (models) => {
        Feedback.belongsTo(models.Customer, {
            foreignKey: 'CustomerID',
            as: 'customer'
        });
        Feedback.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
        Feedback.belongsTo(models.Staff, {
            foreignKey: 'RespondedBy',
            as: 'responder'
        });
    };

    return Feedback;
};
