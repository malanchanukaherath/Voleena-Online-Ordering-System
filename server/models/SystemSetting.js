const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        SettingID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'setting_id'
        },
        SettingKey: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: 'setting_key'
        },
        SettingValue: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'setting_value'
        },
        Description: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'description'
        },
        UpdatedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
                model: 'staff',
                key: 'staff_id'
            },
            field: 'updated_by'
        },
        UpdatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'updated_at'
        }
    }, {
        tableName: 'system_settings',
        timestamps: false
    });

    return SystemSetting;
};
