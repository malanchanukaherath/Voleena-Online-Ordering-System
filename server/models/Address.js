const { DataTypes } = require('sequelize');

// Frontend connection: Defines database structure used by customer/staff/admin features.
module.exports = (sequelize) => {
    const Address = sequelize.define('Address', {
        AddressID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'address_id'
        },
        CustomerID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'customer',
                key: 'customer_id'
            },
            field: 'customer_id'
        },
        AddressLine1: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'address_line1'
        },
        AddressLine2: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'address_line2'
        },
        City: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'city'
        },
        PostalCode: {
            type: DataTypes.STRING(10),
            allowNull: true,
            field: 'postal_code'
        },
        District: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'district'
        },
        Latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            field: 'latitude'
        },
        Longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            field: 'longitude'
        }
    }, {
        tableName: 'address',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Address.associate = (models) => {
        Address.belongsTo(models.Customer, {
            foreignKey: 'CustomerID',
            as: 'customer'
        });
    };

    return Address;
};
