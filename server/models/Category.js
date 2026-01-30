const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        CategoryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        Name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'Name'
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'Description'
        },
        ImageURL: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'ImageURL'
        }
    }, {
        tableName: 'Category',
        timestamps: true,
        createdAt: 'CreatedAt',
        updatedAt: 'UpdatedAt'
    });

    return Category;
};
