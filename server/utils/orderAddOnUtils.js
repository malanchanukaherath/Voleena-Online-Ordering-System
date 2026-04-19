const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { AddonOption, MenuItemAddonOption, AddonOptionAudit, sequelize } = require('../models');

const ORDER_ADDON_NOTES_PREFIX = '__VOLEENA_ADDONS__:';
const MENU_ADDON_CONFIG_PATH = path.join(__dirname, '..', 'config', 'menu-addons.json');

const DEFAULT_MENU_ADDON_CATALOG = [
    {
        id: 'extra_chicken_piece',
        name: 'Extra Chicken Piece',
        price: 350,
        maxQuantity: 3
    },
    {
        id: 'add_cheese',
        name: 'Add Cheese',
        price: 120,
        maxQuantity: 3
    },
    {
        id: 'extra_sauce',
        name: 'Extra Sauce',
        price: 80,
        maxQuantity: 4
    }
];

// Code Review: Function toMoney in server\utils\orderAddOnUtils.js. Used in: client/src/pages/OrderTracking.jsx, client/src/utils/cartStorage.js, server/services/orderService.js.
const toMoney = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Number(numeric.toFixed(2));
};

// Code Review: Function toBoolean in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const toBoolean = (value, fallback = false) => {
    if (value === undefined || value === null) {
        return fallback;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
        return true;
    }

    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
        return false;
    }

    return fallback;
};

// Code Review: Function toPositiveInteger in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const toPositiveInteger = (value, fallback = 1) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }

    const floored = Math.floor(numeric);
    if (floored < 1) {
        return fallback;
    }

    return floored;
};

// Code Review: Function normalizeCode in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const normalizeCode = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '_');

// Code Review: Function slugFromName in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const slugFromName = (name) => normalizeCode(name).replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');

// Code Review: Function isAddOnSchemaUnavailableError in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const isAddOnSchemaUnavailableError = (error) => {
    const mysqlCode = error?.original?.code || error?.parent?.code || error?.code;
    const message = [error?.message, error?.original?.sqlMessage, error?.parent?.sqlMessage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    if (['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR', 'ER_CANT_CREATE_TABLE', 'ER_NO_REFERENCED_ROW_2'].includes(mysqlCode)) {
        return true;
    }

    return ['addon_option', 'menu_item_addon_option', 'addon_option_audit', 'default_max_qty']
        .some((token) => message.includes(token));
};

// Code Review: Function normalizeCatalogEntry in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const normalizeCatalogEntry = (entry) => {
    const id = String(entry?.id || '').trim();
    const name = String(entry?.name || '').trim();
    const maxQuantityRaw = Number(entry?.maxQuantity);

    if (!id || !name) {
        return null;
    }

    return {
        id,
        name,
        price: toMoney(entry?.price),
        maxQuantity: Number.isFinite(maxQuantityRaw) && maxQuantityRaw > 0 ? Math.floor(maxQuantityRaw) : 1,
        isActive: entry?.isActive !== false,
        description: entry?.description ? String(entry.description).trim() : null,
        addonGroup: entry?.addonGroup ? String(entry.addonGroup).trim() : null,
        displayOrder: Number.isFinite(Number(entry?.displayOrder)) ? Math.floor(Number(entry.displayOrder)) : 0
    };
};

// Code Review: Function toPublicCatalogEntry in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const toPublicCatalogEntry = (entry, maxQuantityOverride = null) => {
    if (!entry) {
        return null;
    }

    const id = normalizeCode(entry.Code || entry.code || entry.id || `addon_${entry.AddOnOptionID || entry.addon_option_id || ''}`);
    const name = String(entry.Name || entry.name || '').trim();

    if (!id || !name) {
        return null;
    }

    const maxQuantity = maxQuantityOverride !== null
        ? toPositiveInteger(maxQuantityOverride, 1)
        : toPositiveInteger(entry.DefaultMaxQty ?? entry.default_max_qty ?? entry.maxQuantity, 1);

    return {
        id,
        name,
        description: entry.Description ? String(entry.Description).trim() : (entry.description ? String(entry.description).trim() : null),
        addonGroup: entry.AddonGroup ? String(entry.AddonGroup).trim() : (entry.addonGroup ? String(entry.addonGroup).trim() : null),
        displayOrder: Number.isFinite(Number(entry.DisplayOrder ?? entry.displayOrder)) ? Math.floor(Number(entry.DisplayOrder ?? entry.displayOrder)) : 0,
        price: toMoney(entry.PriceDelta ?? entry.price_delta ?? entry.price),
        maxQuantity,
        isActive: toBoolean(entry.IsActive ?? entry.is_active ?? entry.isActive, true)
    };
};

// Code Review: Function buildDefaultConfig in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const buildDefaultConfig = () => ({
    catalog: DEFAULT_MENU_ADDON_CATALOG.map((entry) => normalizeCatalogEntry(entry)).filter(Boolean),
    menuAssignments: {}
});

// Code Review: Function writeConfig in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const writeConfig = (config) => {
    fs.writeFileSync(MENU_ADDON_CONFIG_PATH, JSON.stringify(config, null, 2));
};

// Code Review: Function ensureConfigFile in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const ensureConfigFile = () => {
    if (!fs.existsSync(MENU_ADDON_CONFIG_PATH)) {
        writeConfig(buildDefaultConfig());
    }
};

// Code Review: Function readConfig in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const readConfig = () => {
    ensureConfigFile();

    try {
        const raw = fs.readFileSync(MENU_ADDON_CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(raw);

        const normalizedCatalog = (Array.isArray(parsed?.catalog) ? parsed.catalog : [])
            .map((entry) => normalizeCatalogEntry(entry))
            .filter(Boolean);

        const safeCatalog = normalizedCatalog.length > 0
            ? normalizedCatalog
            : buildDefaultConfig().catalog;

        const safeCatalogIds = new Set(safeCatalog.map((entry) => entry.id));
        const rawAssignments = parsed?.menuAssignments && typeof parsed.menuAssignments === 'object'
            ? parsed.menuAssignments
            : {};

        const safeAssignments = Object.entries(rawAssignments).reduce((accumulator, [menuItemId, ids]) => {
            if (!Array.isArray(ids)) {
                return accumulator;
            }

            const safeIds = [...new Set(ids.map((entry) => String(entry || '').trim()).filter((id) => safeCatalogIds.has(id)))];
            accumulator[String(menuItemId)] = safeIds;
            return accumulator;
        }, {});

        return {
            catalog: safeCatalog,
            menuAssignments: safeAssignments
        };
    } catch {
        const fallback = buildDefaultConfig();
        writeConfig(fallback);
        return fallback;
    }
};

// Code Review: Function listFileCatalog in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const listFileCatalog = ({ includeInactive = false } = {}) => {
    const config = readConfig();
    return config.catalog
        .filter((entry) => includeInactive || entry.isActive !== false)
        .sort((left, right) => {
            const orderDiff = Number(left.displayOrder || 0) - Number(right.displayOrder || 0);
            if (orderDiff !== 0) {
                return orderDiff;
            }

            return String(left.name || '').localeCompare(String(right.name || ''));
        })
        .map((entry) => normalizeCatalogEntry(entry))
        .filter(Boolean);
};

// Code Review: Function normalizeCatalogPayload in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const normalizeCatalogPayload = (payload, { isCreate = false } = {}) => {
    const source = payload && typeof payload === 'object' ? payload : {};
    const trimmedName = source.name !== undefined ? String(source.name || '').trim() : undefined;
    const resolvedId = source.id !== undefined
        ? normalizeCode(source.id)
        : (isCreate ? slugFromName(trimmedName || '') : undefined);

    if (isCreate && (!resolvedId || !/^[a-z0-9_-]{2,80}$/.test(resolvedId))) {
        throw new Error('A valid add-on id is required (2-80 chars, lowercase letters, numbers, _ or -)');
    }

    if (isCreate && (!trimmedName || trimmedName.length < 2)) {
        throw new Error('Add-on name must be at least 2 characters');
    }

    const normalized = {
        id: resolvedId,
        name: trimmedName,
        description: source.description !== undefined ? String(source.description || '').trim() : undefined,
        addonGroup: source.addonGroup !== undefined ? String(source.addonGroup || '').trim() : undefined,
        displayOrder: source.displayOrder !== undefined ? Math.floor(Number(source.displayOrder) || 0) : undefined,
        price: source.price !== undefined ? toMoney(source.price) : undefined,
        maxQuantity: source.maxQuantity !== undefined ? toPositiveInteger(source.maxQuantity, 1) : undefined,
        isActive: source.isActive !== undefined ? toBoolean(source.isActive, true) : undefined
    };

    if (normalized.name !== undefined && normalized.name.length < 2) {
        throw new Error('Add-on name must be at least 2 characters');
    }

    if (normalized.description !== undefined && normalized.description.length > 255) {
        throw new Error('Add-on description cannot exceed 255 characters');
    }

    if (normalized.addonGroup !== undefined && normalized.addonGroup.length > 80) {
        throw new Error('Add-on group cannot exceed 80 characters');
    }

    if (normalized.price !== undefined && normalized.price < 0) {
        throw new Error('Add-on price must be zero or greater');
    }

    return normalized;
};

// Code Review: Function createCatalogEntryInFile in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const createCatalogEntryInFile = (payload) => {
    const normalized = normalizeCatalogPayload(payload, { isCreate: true });
    const config = readConfig();

    if (config.catalog.some((entry) => entry.id === normalized.id)) {
        throw new Error('Add-on id already exists');
    }

    if (config.catalog.some((entry) => String(entry.name || '').toLowerCase() === String(normalized.name || '').toLowerCase())) {
        throw new Error('Add-on name already exists');
    }

    const next = {
        id: normalized.id,
        name: normalized.name,
        description: normalized.description || null,
        addonGroup: normalized.addonGroup || null,
        displayOrder: normalized.displayOrder ?? 0,
        price: normalized.price ?? 0,
        maxQuantity: normalized.maxQuantity ?? 1,
        isActive: normalized.isActive !== undefined ? normalized.isActive : true
    };

    config.catalog.push(next);
    writeConfig(config);
    return normalizeCatalogEntry(next);
};

// Code Review: Function updateCatalogEntryInFile in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const updateCatalogEntryInFile = (id, payload) => {
    const safeId = normalizeCode(id);
    if (!safeId) {
        throw new Error('A valid add-on id is required');
    }

    const normalized = normalizeCatalogPayload(payload, { isCreate: false });
    const config = readConfig();
    const targetIndex = config.catalog.findIndex((entry) => entry.id === safeId);

    if (targetIndex < 0) {
        throw new Error('Add-on not found');
    }

    if (normalized.name && config.catalog.some((entry, index) => index !== targetIndex && String(entry.name || '').toLowerCase() === normalized.name.toLowerCase())) {
        throw new Error('Add-on name already exists');
    }

    const current = config.catalog[targetIndex];
    const next = {
        ...current,
        ...(normalized.name !== undefined ? { name: normalized.name } : {}),
        ...(normalized.description !== undefined ? { description: normalized.description || null } : {}),
        ...(normalized.addonGroup !== undefined ? { addonGroup: normalized.addonGroup || null } : {}),
        ...(normalized.displayOrder !== undefined ? { displayOrder: normalized.displayOrder } : {}),
        ...(normalized.price !== undefined ? { price: normalized.price } : {}),
        ...(normalized.maxQuantity !== undefined ? { maxQuantity: normalized.maxQuantity } : {}),
        ...(normalized.isActive !== undefined ? { isActive: normalized.isActive } : {})
    };

    config.catalog[targetIndex] = next;
    writeConfig(config);
    return normalizeCatalogEntry(next);
};

// Code Review: Function deactivateCatalogEntryInFile in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const deactivateCatalogEntryInFile = (id) => {
    return updateCatalogEntryInFile(id, { isActive: false });
};

// Code Review: Function recordAuditSafe in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const recordAuditSafe = async ({ addOnOptionId, action, changedBy = null, contextType = 'CATALOG', contextId = null, changeSummary = null, payloadJSON = null }) => {
    try {
        if (!AddonOptionAudit || !addOnOptionId) {
            return;
        }

        await AddonOptionAudit.create({
            AddOnOptionID: addOnOptionId,
            Action: action,
            ChangedBy: changedBy,
            ContextType: contextType,
            ContextID: contextId,
            ChangeSummary: changeSummary,
            PayloadJSON: payloadJSON
        });
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            console.warn('Add-on audit write failed:', error.message);
        }
    }
};

// Code Review: Function getCatalogFromDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const getCatalogFromDatabase = async ({ includeInactive = false } = {}) => {
    const where = includeInactive ? {} : { IsActive: true };
    const rows = await AddonOption.findAll({
        where,
        order: [
            ['DisplayOrder', 'ASC'],
            ['Name', 'ASC'],
            ['AddOnOptionID', 'ASC']
        ]
    });

    return rows
        .map((row) => toPublicCatalogEntry(row))
        .filter(Boolean);
};

// Code Review: Function getConfiguredAddOnIdsFromDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const getConfiguredAddOnIdsFromDatabase = async (menuItemId) => {
    const numericMenuItemId = Number.parseInt(menuItemId, 10);
    if (!Number.isInteger(numericMenuItemId) || numericMenuItemId < 1) {
        return null;
    }

    const assignmentCount = await MenuItemAddonOption.count({
        where: { MenuItemID: numericMenuItemId }
    });

    if (assignmentCount === 0) {
        return null;
    }

    const rows = await MenuItemAddonOption.findAll({
        where: { MenuItemID: numericMenuItemId },
        include: [{
            model: AddonOption,
            as: 'addOnOption',
            attributes: ['AddOnOptionID', 'Code']
        }],
        order: [
            ['DisplayOrder', 'ASC'],
            ['MenuItemAddonOptionID', 'ASC']
        ]
    });

    return [...new Set(rows
        .map((row) => toPublicCatalogEntry(row.addOnOption)?.id)
        .filter(Boolean))];
};

// Code Review: Function getAllowedAddOnsForMenuItemFromDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const getAllowedAddOnsForMenuItemFromDatabase = async (menuItemId) => {
    const numericMenuItemId = Number.parseInt(menuItemId, 10);
    if (!Number.isInteger(numericMenuItemId) || numericMenuItemId < 1) {
        return [];
    }

    const assignmentCount = await MenuItemAddonOption.count({
        where: { MenuItemID: numericMenuItemId }
    });

    if (assignmentCount > 0) {
        const rows = await MenuItemAddonOption.findAll({
            where: { MenuItemID: numericMenuItemId },
            include: [{
                model: AddonOption,
                as: 'addOnOption',
                where: { IsActive: true },
                required: true
            }],
            order: [
                ['DisplayOrder', 'ASC'],
                [{ model: AddonOption, as: 'addOnOption' }, 'DisplayOrder', 'ASC'],
                [{ model: AddonOption, as: 'addOnOption' }, 'Name', 'ASC']
            ]
        });

        return rows
            .map((row) => toPublicCatalogEntry(row.addOnOption, row.MaxQty))
            .filter(Boolean);
    }

    return getCatalogFromDatabase({ includeInactive: false });
};

// Code Review: Function setConfiguredAddOnIdsInDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const setConfiguredAddOnIdsInDatabase = async (menuItemId, addOnIds, actorId = null) => {
    const numericMenuItemId = Number.parseInt(menuItemId, 10);
    if (!Number.isInteger(numericMenuItemId) || numericMenuItemId < 1) {
        throw new Error('A valid menu item id is required');
    }

    if (addOnIds === null) {
        await MenuItemAddonOption.destroy({
            where: { MenuItemID: numericMenuItemId }
        });

        await recordAuditSafe({
            addOnOptionId: null,
            action: 'UNASSIGN',
            changedBy: actorId,
            contextType: 'MENU_ITEM',
            contextId: numericMenuItemId,
            changeSummary: 'Reset menu item add-ons to inherited defaults'
        });

        return null;
    }

    if (!Array.isArray(addOnIds)) {
        throw new Error('addOnIds must be an array or null');
    }

    const safeIds = [...new Set(addOnIds.map((entry) => normalizeCode(entry)).filter(Boolean))];

    const options = safeIds.length > 0
        ? await AddonOption.findAll({
            where: {
                Code: { [Op.in]: safeIds },
                IsActive: true
            }
        })
        : [];

    const optionByCode = new Map(options.map((entry) => [normalizeCode(entry.Code), entry]));
    const invalidIds = safeIds.filter((id) => !optionByCode.has(id));
    if (invalidIds.length > 0) {
        throw new Error(`Unknown add-on ids: ${invalidIds.join(', ')}`);
    }

    await sequelize.transaction(async (transaction) => {
        await MenuItemAddonOption.destroy({
            where: { MenuItemID: numericMenuItemId },
            transaction
        });

        if (safeIds.length > 0) {
            await MenuItemAddonOption.bulkCreate(
                safeIds.map((id, index) => {
                    const option = optionByCode.get(id);
                    return {
                        MenuItemID: numericMenuItemId,
                        AddOnOptionID: option.AddOnOptionID,
                        IsRequired: false,
                        MaxQty: toPositiveInteger(option.DefaultMaxQty, 1),
                        DisplayOrder: index + 1,
                        IsDefault: false
                    };
                }),
                { transaction }
            );
        }
    });

    return safeIds;
};

// Code Review: Function createCatalogEntryInDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const createCatalogEntryInDatabase = async (payload, actorId = null) => {
    const normalized = normalizeCatalogPayload(payload, { isCreate: true });

    const existingByCode = await AddonOption.findOne({ where: { Code: normalized.id } });
    if (existingByCode) {
        throw new Error('Add-on id already exists');
    }

    const existingByName = await AddonOption.findOne({ where: { Name: normalized.name } });
    if (existingByName) {
        throw new Error('Add-on name already exists');
    }

    const created = await AddonOption.create({
        Code: normalized.id,
        Name: normalized.name,
        Description: normalized.description || null,
        AddonGroup: normalized.addonGroup || null,
        DisplayOrder: normalized.displayOrder ?? 0,
        PriceDelta: normalized.price ?? 0,
        DefaultMaxQty: normalized.maxQuantity ?? 1,
        IsActive: normalized.isActive !== undefined ? normalized.isActive : true,
        CreatedBy: actorId,
        UpdatedBy: actorId
    });

    await recordAuditSafe({
        addOnOptionId: created.AddOnOptionID,
        action: 'CREATE',
        changedBy: actorId,
        contextType: 'CATALOG',
        contextId: created.AddOnOptionID,
        changeSummary: `Created add-on ${created.Name}`,
        payloadJSON: { code: created.Code, name: created.Name }
    });

    return toPublicCatalogEntry(created);
};

// Code Review: Function updateCatalogEntryInDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const updateCatalogEntryInDatabase = async (id, payload, actorId = null) => {
    const safeId = normalizeCode(id);
    if (!safeId) {
        throw new Error('A valid add-on id is required');
    }

    const normalized = normalizeCatalogPayload(payload, { isCreate: false });
    const target = await AddonOption.findOne({ where: { Code: safeId } });
    if (!target) {
        throw new Error('Add-on not found');
    }

    if (normalized.name && normalized.name !== target.Name) {
        const existingByName = await AddonOption.findOne({ where: { Name: normalized.name } });
        if (existingByName) {
            throw new Error('Add-on name already exists');
        }
    }

    const updateData = {
        UpdatedBy: actorId
    };

    if (normalized.name !== undefined) updateData.Name = normalized.name;
    if (normalized.description !== undefined) updateData.Description = normalized.description || null;
    if (normalized.addonGroup !== undefined) updateData.AddonGroup = normalized.addonGroup || null;
    if (normalized.displayOrder !== undefined) updateData.DisplayOrder = normalized.displayOrder;
    if (normalized.price !== undefined) updateData.PriceDelta = normalized.price;
    if (normalized.maxQuantity !== undefined) updateData.DefaultMaxQty = normalized.maxQuantity;
    if (normalized.isActive !== undefined) updateData.IsActive = normalized.isActive;

    const previousIsActive = toBoolean(target.IsActive, true);
    await target.update(updateData);
    const nextIsActive = toBoolean(target.IsActive, true);

    const action = normalized.isActive === false
        ? 'DEACTIVATE'
        : (normalized.isActive === true && previousIsActive === false && nextIsActive === true ? 'ACTIVATE' : 'UPDATE');

    await recordAuditSafe({
        addOnOptionId: target.AddOnOptionID,
        action,
        changedBy: actorId,
        contextType: 'CATALOG',
        contextId: target.AddOnOptionID,
        changeSummary: `Updated add-on ${target.Name}`,
        payloadJSON: { code: target.Code, fields: Object.keys(updateData) }
    });

    return toPublicCatalogEntry(target);
};

// Code Review: Function deactivateCatalogEntryInDatabase in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const deactivateCatalogEntryInDatabase = async (id, actorId = null) => {
    const target = await AddonOption.findOne({ where: { Code: normalizeCode(id) } });
    if (!target) {
        throw new Error('Add-on not found');
    }

    await target.update({
        IsActive: false,
        UpdatedBy: actorId
    });

    await recordAuditSafe({
        addOnOptionId: target.AddOnOptionID,
        action: 'DEACTIVATE',
        changedBy: actorId,
        contextType: 'CATALOG',
        contextId: target.AddOnOptionID,
        changeSummary: `Deactivated add-on ${target.Name}`,
        payloadJSON: { code: target.Code }
    });

    return toPublicCatalogEntry(target);
};

// Code Review: Function getConfiguredAddOnIdsForMenuItem in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const getConfiguredAddOnIdsForMenuItem = async (menuItemId) => {
    const safeMenuItemId = String(menuItemId || '').trim();
    if (!safeMenuItemId) {
        return null;
    }

    try {
        return await getConfiguredAddOnIdsFromDatabase(safeMenuItemId);
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }

        const config = readConfig();
        if (!Object.prototype.hasOwnProperty.call(config.menuAssignments, safeMenuItemId)) {
            return null;
        }

        return [...config.menuAssignments[safeMenuItemId]];
    }
};

// Code Review: Function setConfiguredAddOnIdsForMenuItem in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const setConfiguredAddOnIdsForMenuItem = async (menuItemId, addOnIds, actorId = null) => {
    const safeMenuItemId = String(menuItemId || '').trim();
    if (!safeMenuItemId) {
        throw new Error('A valid menu item id is required');
    }

    try {
        return await setConfiguredAddOnIdsInDatabase(safeMenuItemId, addOnIds, actorId);
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }
    }

    const config = readConfig();
    const catalogIds = new Set(config.catalog.map((entry) => entry.id));

    if (addOnIds === null) {
        delete config.menuAssignments[safeMenuItemId];
        writeConfig(config);
        return null;
    }

    if (!Array.isArray(addOnIds)) {
        throw new Error('addOnIds must be an array or null');
    }

    const safeIds = [...new Set(addOnIds.map((entry) => String(entry || '').trim()).filter(Boolean))];
    const invalid = safeIds.filter((id) => !catalogIds.has(id));

    if (invalid.length > 0) {
        throw new Error(`Unknown add-on ids: ${invalid.join(', ')}`);
    }

    config.menuAssignments[safeMenuItemId] = safeIds;
    writeConfig(config);

    return [...safeIds];
};

// Code Review: Function getDefaultMenuAddOns in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const getDefaultMenuAddOns = async () => {
    try {
        return await getCatalogFromDatabase({ includeInactive: false });
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }

        return listFileCatalog({ includeInactive: false });
    }
};

// Code Review: Function getAllowedAddOnsForMenuItem in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/services/orderService.js, server/utils/orderAddOnUtils.js.
const getAllowedAddOnsForMenuItem = async (menuItemId) => {
    const safeMenuItemId = String(menuItemId || '').trim();
    if (!safeMenuItemId) {
        return [];
    }

    try {
        return await getAllowedAddOnsForMenuItemFromDatabase(safeMenuItemId);
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }
    }

    const config = readConfig();
    const catalogById = new Map(
        config.catalog
            .filter((entry) => entry.isActive !== false)
            .map((entry) => [entry.id, {
                id: entry.id,
                name: entry.name,
                price: toMoney(entry.price),
                maxQuantity: Number(entry.maxQuantity) || 1
            }])
    );

    if (!Object.prototype.hasOwnProperty.call(config.menuAssignments, safeMenuItemId)) {
        return [...catalogById.values()];
    }

    const assigned = config.menuAssignments[safeMenuItemId] || [];
    return assigned
        .map((id) => catalogById.get(id))
        .filter(Boolean);
};

// Code Review: Function listAddOnCatalog in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const listAddOnCatalog = async ({ includeInactive = false } = {}) => {
    try {
        return await getCatalogFromDatabase({ includeInactive });
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }

        return listFileCatalog({ includeInactive });
    }
};

// Code Review: Function createAddOnCatalogEntry in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const createAddOnCatalogEntry = async (payload, actorId = null) => {
    try {
        return await createCatalogEntryInDatabase(payload, actorId);
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }

        return createCatalogEntryInFile(payload);
    }
};

// Code Review: Function updateAddOnCatalogEntry in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const updateAddOnCatalogEntry = async (id, payload, actorId = null) => {
    try {
        return await updateCatalogEntryInDatabase(id, payload, actorId);
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }

        return updateCatalogEntryInFile(id, payload);
    }
};

// Code Review: Function deactivateAddOnCatalogEntry in server\utils\orderAddOnUtils.js. Used in: server/controllers/menuItemController.js, server/utils/orderAddOnUtils.js.
const deactivateAddOnCatalogEntry = async (id, actorId = null) => {
    try {
        return await deactivateCatalogEntryInDatabase(id, actorId);
    } catch (error) {
        if (!isAddOnSchemaUnavailableError(error)) {
            throw error;
        }

        return deactivateCatalogEntryInFile(id);
    }
};

// Code Review: Function parseOrderItemNotes in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const parseOrderItemNotes = (rawNotes) => {
    const notes = String(rawNotes || '').trim();
    if (!notes) {
        return {
            customerNotes: '',
            baseUnitPrice: null,
            addOns: []
        };
    }

    if (!notes.startsWith(ORDER_ADDON_NOTES_PREFIX)) {
        return {
            customerNotes: notes,
            baseUnitPrice: null,
            addOns: []
        };
    }

    const payload = notes.slice(ORDER_ADDON_NOTES_PREFIX.length);

    try {
        const parsed = JSON.parse(payload);
        return {
            customerNotes: String(parsed?.customerNotes || '').trim(),
            baseUnitPrice: Number.isFinite(Number(parsed?.baseUnitPrice))
                ? toMoney(parsed.baseUnitPrice)
                : null,
            addOns: Array.isArray(parsed?.addOns) ? parsed.addOns : []
        };
    } catch (error) {
        return {
            customerNotes: '',
            baseUnitPrice: null,
            addOns: []
        };
    }
};

// Code Review: Function serializeOrderItemNotes in server\utils\orderAddOnUtils.js. Used in: server/services/orderService.js, server/utils/orderAddOnUtils.js.
const serializeOrderItemNotes = ({ customerNotes = '', baseUnitPrice = null, addOns = [] }) => {
    const safeCustomerNotes = String(customerNotes || '').trim();
    const safeAddOns = Array.isArray(addOns) ? addOns.filter((entry) => entry && entry.id) : [];
    const safeBaseUnitPrice = Number.isFinite(Number(baseUnitPrice)) ? toMoney(baseUnitPrice) : null;

    if (!safeAddOns.length && !safeCustomerNotes) {
        return null;
    }

    if (!safeAddOns.length) {
        return safeCustomerNotes;
    }

    return `${ORDER_ADDON_NOTES_PREFIX}${JSON.stringify({
        customerNotes: safeCustomerNotes,
        baseUnitPrice: safeBaseUnitPrice,
        addOns: safeAddOns.map((entry) => ({
            id: String(entry.id),
            name: String(entry?.name || '').trim() || undefined,
            unitPrice: Number.isFinite(Number(entry?.unitPrice)) ? toMoney(entry.unitPrice) : undefined,
            quantity: Number(entry.quantity)
        }))
    })}`;
};

// Code Review: Function getAllowedAddOnsForOrderItem in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const getAllowedAddOnsForOrderItem = async (orderItem) => {
    if (!orderItem || orderItem.ComboID || orderItem.combo || orderItem.ComboID === 0) {
        return [];
    }

    const menuItemId = orderItem.MenuItemID || orderItem.menuItemId || orderItem.menu_item_id;
    return await getAllowedAddOnsForMenuItem(menuItemId);
};

// Code Review: Function normalizeAddOnSelections in server\utils\orderAddOnUtils.js. Used in: server/services/orderService.js, server/utils/orderAddOnUtils.js.
const normalizeAddOnSelections = (selections, allowedAddOns) => {
    const allowedById = new Map((allowedAddOns || []).map((entry) => [entry.id, entry]));
    const mergedById = new Map();

    for (const rawEntry of Array.isArray(selections) ? selections : []) {
        const id = String(rawEntry?.id || '').trim();
        if (!id) {
            continue;
        }

        const allowed = allowedById.get(id);
        if (!allowed) {
            throw new Error(`Invalid add-on selected: ${id}`);
        }

        const rawQuantity = Number(rawEntry?.quantity ?? 1);
        const quantity = Number.isInteger(rawQuantity) ? rawQuantity : Math.floor(rawQuantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error(`Invalid quantity for add-on: ${allowed.name}`);
        }

        if (quantity > allowed.maxQuantity) {
            throw new Error(`Maximum quantity exceeded for add-on: ${allowed.name}`);
        }

        mergedById.set(id, {
            id,
            name: allowed.name,
            unitPrice: toMoney(allowed.price),
            quantity,
            total: toMoney(allowed.price * quantity)
        });
    }

    return [...mergedById.values()];
};

// Code Review: Function getAddOnsPerUnitTotal in server\utils\orderAddOnUtils.js. Used in: server/services/orderService.js, server/utils/orderAddOnUtils.js.
const getAddOnsPerUnitTotal = (normalizedAddOns) => {
    return toMoney(
        (normalizedAddOns || []).reduce((sum, entry) => sum + toMoney(entry.unitPrice) * Number(entry.quantity || 0), 0)
    );
};

// Code Review: Function buildOrderItemAddOnState in server\utils\orderAddOnUtils.js. Used in: server/utils/orderAddOnUtils.js.
const buildOrderItemAddOnState = (orderItem, allowedAddOns) => {
    const parsed = parseOrderItemNotes(orderItem?.ItemNotes);
    const normalizedSelectedAddOns = normalizeAddOnSelections(parsed.addOns, allowedAddOns);
    const selectedAddOnsPerUnit = getAddOnsPerUnitTotal(normalizedSelectedAddOns);
    const currentUnitPrice = toMoney(orderItem?.UnitPrice);

    let baseUnitPrice = parsed.baseUnitPrice;
    if (!Number.isFinite(Number(baseUnitPrice))) {
        baseUnitPrice = toMoney(currentUnitPrice - selectedAddOnsPerUnit);
    }

    if (baseUnitPrice < 0) {
        baseUnitPrice = 0;
    }

    return {
        customerNotes: parsed.customerNotes,
        baseUnitPrice,
        selectedAddOns: normalizedSelectedAddOns,
        selectedAddOnsPerUnit,
        currentUnitPrice,
        quantity: Number(orderItem?.Quantity || 0)
    };
};

module.exports = {
    ORDER_ADDON_NOTES_PREFIX,
    getDefaultMenuAddOns,
    listAddOnCatalog,
    createAddOnCatalogEntry,
    updateAddOnCatalogEntry,
    deactivateAddOnCatalogEntry,
    getAllowedAddOnsForMenuItem,
    getConfiguredAddOnIdsForMenuItem,
    setConfiguredAddOnIdsForMenuItem,
    parseOrderItemNotes,
    serializeOrderItemNotes,
    getAllowedAddOnsForOrderItem,
    normalizeAddOnSelections,
    getAddOnsPerUnitTotal,
    buildOrderItemAddOnState,
    toMoney
};
