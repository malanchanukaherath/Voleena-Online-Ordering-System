const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Feedback = sequelize.define('Feedback', {
        FeedbackID: {
            type: DataTypes.INTEGER,
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
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            },
            field: 'customer_id'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Order',
                key: 'OrderID'
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
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
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
