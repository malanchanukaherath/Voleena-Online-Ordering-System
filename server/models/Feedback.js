const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Feedback = sequelize.define('Feedback', {
        FeedbackID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'FeedbackID'
        },
        Rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            field: 'Rating'
        },
        Comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Comment'
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Customer',
                key: 'CustomerID'
            },
            field: 'CustomerID'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Order',
                key: 'OrderID'
            },
            field: 'OrderID'
        },
        FeedbackType: {
            type: DataTypes.ENUM('ORDER', 'DELIVERY', 'GENERAL'),
            defaultValue: 'ORDER',
            field: 'FeedbackType'
        },
        AdminResponse: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'AdminResponse'
        },
        RespondedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'RespondedAt'
        },
        RespondedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'RespondedBy'
        }
    }, {
        tableName: 'Feedback',
        timestamps: true,
        createdAt: 'CreatedAt',
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
