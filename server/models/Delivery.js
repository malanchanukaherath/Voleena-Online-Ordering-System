const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Delivery = sequelize.define('Delivery', {
        DeliveryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'DeliveryID'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Order',
                key: 'OrderID'
            },
            field: 'OrderID'
        },
        DeliveryStaffID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Staff',
                key: 'StaffID'
            },
            field: 'DeliveryStaffID'
        },
        AddressID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Address',
                key: 'AddressID'
            },
            field: 'AddressID'
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'Status'
        },
        AssignedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'AssignedAt'
        },
        PickedUpAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'PickedUpAt'
        },
        DeliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'DeliveredAt'
        },
        EstimatedDeliveryTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'EstimatedDeliveryTime'
        },
        DeliveryProof: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'DeliveryProof'
        },
        DeliveryNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'DeliveryNotes'
        },
        Distance: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            field: 'Distance'
        }
    }, {
        tableName: 'Delivery',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Delivery.associate = (models) => {
        Delivery.belongsTo(models.Order, {
            foreignKey: 'OrderID',
            as: 'order'
        });
        Delivery.belongsTo(models.Staff, {
            foreignKey: 'DeliveryStaffID',
            as: 'deliveryStaff'
        });
        Delivery.belongsTo(models.Address, {
            foreignKey: 'AddressID',
            as: 'address'
        });
    };

    return Delivery;
};
