const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AddonOptionAudit = sequelize.define('AddonOptionAudit', {
        AddonOptionAuditID: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            field: 'addon_option_audit_id'
        },
        AddOnOptionID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'addon_option_id'
        },
        Action: {
            type: DataTypes.ENUM('CREATE', 'UPDATE', 'ACTIVATE', 'DEACTIVATE', 'ASSIGN', 'UNASSIGN'),
            allowNull: false,
            field: 'action'
        },
        ChangedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'changed_by'
        },
        ContextType: {
            type: DataTypes.ENUM('CATALOG', 'MENU_ITEM'),
            allowNull: false,
            defaultValue: 'CATALOG',
            field: 'context_type'
        },
        ContextID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'context_id'
        },
        ChangeSummary: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'change_summary'
        },
        PayloadJSON: {
            type: DataTypes.JSON,
            allowNull: true,
            field: 'payload_json'
        },
        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        tableName: 'addon_option_audit',
        timestamps: false
    });

    AddonOptionAudit.associate = (models) => {
        AddonOptionAudit.belongsTo(models.AddonOption, {
            foreignKey: 'AddOnOptionID',
            as: 'addOnOption'
        });

        AddonOptionAudit.belongsTo(models.Staff, {
            foreignKey: 'ChangedBy',
            as: 'changedByStaff'
        });
    };

    return AddonOptionAudit;
};
