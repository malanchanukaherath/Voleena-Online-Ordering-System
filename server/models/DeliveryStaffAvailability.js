const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_DELIVERYSTAFFAVAILABILITY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_DELIVERYSTAFFAVAILABILITY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// CODEMAP: BACKEND_SERVER_MODELS_DELIVERYSTAFFAVAILABILITY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');
};
// CODEMAP: BACKEND_SERVER_MODELS_DELIVERYSTAFFAVAILABILITY_JS
// PURPOSE: Backend module with request handling/business logic/data access.
// SEARCH_HINT: Search by exported function name in this file.
const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const DeliveryStaffAvailability = sequelize.define('DeliveryStaffAvailability', {
        AvailabilityID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'availability_id'
        },
        DeliveryStaffID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'delivery_staff_id'
        },
        IsAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'is_available',
            index: true
        },
        CurrentOrderID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'order',
                key: 'order_id'
            },
            field: 'current_order_id'
        }
    }, {
        tableName: 'delivery_staff_availability',
        timestamps: true,
        createdAt: false,
        updatedAt: 'last_updated'
    });

    DeliveryStaffAvailability.associate = (models) => {
        DeliveryStaffAvailability.belongsTo(models.Staff, {
            foreignKey: 'DeliveryStaffID',
            as: 'staff'
        });
        DeliveryStaffAvailability.belongsTo(models.Order, {
            foreignKey: 'CurrentOrderID',
            as: 'currentOrder'
        });
    };

    return DeliveryStaffAvailability;
};



