const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Address = sequelize.define('Address', {
        AddressID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'AddressID'
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
        AddressLine1: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'AddressLine1'
        },
        AddressLine2: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'AddressLine2'
        },
        City: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'City'
        },
        PostalCode: {
            type: DataTypes.STRING(10),
            allowNull: true,
            field: 'PostalCode'
        },
        District: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'District'
        },
        Latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
            field: 'Latitude'
        },
        Longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
            field: 'Longitude'
        }
    }, {
        tableName: 'Address',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    Address.associate = (models) => {
        Address.belongsTo(models.Customer, {
            foreignKey: 'CustomerID',
            as: 'customer'
        });
    };

    return Address;
};
