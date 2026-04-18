const ORDER_ADDON_NOTES_PREFIX = '__VOLEENA_ADDONS__:';

const DEFAULT_MENU_ADDONS = [
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

const toMoney = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Number(numeric.toFixed(2));
};

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
            quantity: Number(entry.quantity)
        }))
    })}`;
};

const getAllowedAddOnsForOrderItem = (orderItem) => {
    if (!orderItem || orderItem.ComboID || orderItem.combo || orderItem.ComboID === 0) {
        return [];
    }

    return DEFAULT_MENU_ADDONS.map((entry) => ({
        id: entry.id,
        name: entry.name,
        price: toMoney(entry.price),
        maxQuantity: Number(entry.maxQuantity) || 1
    }));
};

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

const getAddOnsPerUnitTotal = (normalizedAddOns) => {
    return toMoney(
        (normalizedAddOns || []).reduce((sum, entry) => sum + toMoney(entry.unitPrice) * Number(entry.quantity || 0), 0)
    );
};

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
    parseOrderItemNotes,
    serializeOrderItemNotes,
    getAllowedAddOnsForOrderItem,
    normalizeAddOnSelections,
    getAddOnsPerUnitTotal,
    buildOrderItemAddOnState,
    toMoney
};
