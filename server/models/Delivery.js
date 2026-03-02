const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Delivery = sequelize.define('Delivery', {
        DeliveryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'delivery_id'
        },
        OrderID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'order_id'
        },
        DeliveryStaffID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'delivery_staff_id'
        },
        AddressID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'address',
                key: 'address_id'
            },
            field: 'address_id'
        },
        Status: {
            type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'),
            allowNull: false,
            defaultValue: 'PENDING',
            field: 'status'
        },
        AssignedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'assigned_at'
        },
        PickedUpAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'picked_up_at'
        },
        DeliveredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'delivered_at'
        },
        EstimatedDeliveryTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'estimated_delivery_time'
        },
        DeliveryProof: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'delivery_proof'
        },
        DeliveryNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'delivery_notes'
        },
        FailureReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'failure_reason'
        },
        DistanceKm: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            field: 'distance_km'
        },
        CurrentLatitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            field: 'current_latitude'
        },
        CurrentLongitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            field: 'current_longitude'
        },
        LastLocationUpdate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_location_update'
        }
    }, {
        tableName: 'delivery',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
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
