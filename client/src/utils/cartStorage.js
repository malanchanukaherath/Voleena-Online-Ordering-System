/**
 * Cart Storage Utility
 * Manages shopping cart persistence using localStorage
 * Supports both menu items and combo packs
 */

const STORAGE_KEY = 'voleena_cart';

const hasFiniteStockLimit = (item) => Number.isFinite(item?.stockQuantity) && item.stockQuantity >= 0;

const toMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Number(numeric.toFixed(2));
};

const normalizeAddOnsForCart = (addOns) => {
  const raw = Array.isArray(addOns) ? addOns : [];

  return raw
    .map((entry) => {
      const id = String(entry?.id || '').trim();
      const quantityRaw = Number(entry?.quantity ?? 0);
      const quantity = Number.isInteger(quantityRaw) ? quantityRaw : Math.floor(quantityRaw);

      if (!id || quantity < 1) {
        return null;
      }

      const unitPrice = toMoney(entry?.unitPrice ?? entry?.price ?? 0);
      const maxQuantity = Number(entry?.maxQuantity);

      return {
        id,
        name: String(entry?.name || '').trim(),
        quantity,
        unitPrice,
        maxQuantity: Number.isFinite(maxQuantity) && maxQuantity > 0 ? Math.floor(maxQuantity) : null,
        total: toMoney(unitPrice * quantity)
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.id.localeCompare(right.id));
};

const buildAddOnSignature = (addOns) => {
  const normalized = normalizeAddOnsForCart(addOns);
  if (!normalized.length) {
    return 'none';
  }

  return JSON.stringify(normalized.map((entry) => ({
    id: entry.id,
    quantity: entry.quantity
  })));
};

export const buildCartItemKey = (item) => {
  const safeType = String(item?.type || '').trim() || 'item';
  const safeId = String(item?.id ?? '').trim() || 'unknown';
  const signature = item?.addOnSignature || buildAddOnSignature(item?.addOns);
  return `${safeType}:${safeId}:${signature}`;
};

const normalizeCartEntry = (entry) => {
  const normalizedAddOns = normalizeAddOnsForCart(entry?.addOns);
  const addOnsPerUnit = toMoney(
    normalizedAddOns.reduce((sum, addOn) => sum + toMoney(addOn.unitPrice) * Number(addOn.quantity || 0), 0)
  );
  const normalizedPrice = toMoney(entry?.price);
  const normalizedBasePrice = Number.isFinite(Number(entry?.basePrice))
    ? toMoney(entry.basePrice)
    : toMoney(normalizedPrice - addOnsPerUnit);
  const addOnSignature = buildAddOnSignature(normalizedAddOns);

  const normalized = {
    ...entry,
    notes: String(entry?.notes || ''),
    quantity: Number.isInteger(Number(entry?.quantity)) && Number(entry.quantity) > 0
      ? Number(entry.quantity)
      : 1,
    addOns: normalizedAddOns,
    addOnsPerUnit,
    basePrice: normalizedBasePrice < 0 ? 0 : normalizedBasePrice,
    price: normalizedPrice,
    addOnSignature,
    isAvailable: entry?.isAvailable !== false
  };

  normalized.cartItemKey = String(entry?.cartItemKey || '').trim() || buildCartItemKey(normalized);

  if (!hasFiniteStockLimit(entry)) {
    delete normalized.stockQuantity;
  }

  return normalized;
};

/**
 * Emit cart update event for listeners to react to changes
 */
const emitCartUpdate = () => {
  window.dispatchEvent(new Event('cartUpdated'));
};

/**
 * Get current cart from localStorage
 * @returns {Array} Cart items array
 */
export const getCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(normalizeCartEntry);
  } catch (error) {
    console.error('Failed to read cart storage:', error);
    return [];
  }
};

/**
 * Save cart to localStorage
 * @param {Array} items - Cart items to save
 */
export const setCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitCartUpdate();
};

/**
 * Add item to cart
 * Supports both menu items (type: 'menu') and combos (type: 'combo')
 * If item already exists, increments quantity
 * 
 * @param {Object} item - Item to add
 * @param {number} item.id - Menu item ID or Combo ID
 * @param {string} item.type - 'menu' or 'combo'
 * @param {string} item.name - Item display name
 * @param {number} item.price - Item price
 * @param {string} [item.image] - Item image URL
 * @param {number} [quantity=1] - Quantity to add
 * @returns {Array} Updated cart
 */
export const addToCart = (item, quantity = 1) => {
  if (!item || !item.id || !item.type) {
    throw new Error('Invalid item: must have id and type');
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new Error('Quantity must be a positive integer');
  }

  if (item.isAvailable === false) {
    throw new Error(`${item.name || 'Item'} is not available right now`);
  }

  const normalizedItem = normalizeCartEntry({
    ...item,
    quantity: 1
  });
  const itemKey = buildCartItemKey(normalizedItem);
  const items = getCart();
  const existingIndex = items.findIndex((entry) => {
    const existingKey = String(entry?.cartItemKey || '').trim() || buildCartItemKey(entry);
    return existingKey === itemKey;
  });

  const stockLimit = hasFiniteStockLimit(normalizedItem) ? normalizedItem.stockQuantity : null;
  const currentQuantity = existingIndex >= 0 ? items[existingIndex].quantity : 0;

  if (stockLimit !== null && stockLimit <= 0) {
    throw new Error(`${normalizedItem.name || 'Item'} is out of stock`);
  }

  const desiredQuantity = currentQuantity + quantity;
  const nextQuantity = stockLimit !== null
    ? Math.min(desiredQuantity, stockLimit)
    : desiredQuantity;

  if (nextQuantity <= currentQuantity) {
    throw new Error(`Only ${stockLimit} item(s) available for ${normalizedItem.name || 'this item'}`);
  }

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      ...normalizedItem,
      cartItemKey: itemKey,
      quantity: nextQuantity
    };
  } else {
    items.push({
      cartItemKey: itemKey,
      id: normalizedItem.id,
      type: normalizedItem.type,
      menuItemId: normalizedItem.menuItemId || null,
      comboId: normalizedItem.comboId || null,
      name: normalizedItem.name,
      price: normalizedItem.price,
      basePrice: normalizedItem.basePrice,
      addOns: normalizedItem.addOns,
      addOnsPerUnit: normalizedItem.addOnsPerUnit,
      addOnSignature: normalizedItem.addOnSignature,
      image: normalizedItem.image || null,
      ...(hasFiniteStockLimit(normalizedItem) ? { stockQuantity: normalizedItem.stockQuantity } : {}),
      isAvailable: normalizedItem.isAvailable !== false,
      notes: '',
      quantity: nextQuantity,
      addedAt: new Date().toISOString()
    });
  }

  setCart(items);
  return items;
};

/**
 * Update cart item
 * @param {number} id - Item ID
 * @param {string} type - Item type ('menu' or 'combo')
 * @param {Object} updates - Fields to update (quantity, notes, etc.)
 * @returns {Array} Updated cart
 */
export const updateCartItem = (id, type, updates, cartItemKey = '') => {
  const targetKey = String(cartItemKey || updates?.cartItemKey || '').trim();
  const items = getCart().map((item) => {
    const isTargetMatch = targetKey
      ? String(item?.cartItemKey || '').trim() === targetKey
      : (item.id === id && item.type === type);

    if (isTargetMatch) {
      const merged = normalizeCartEntry({ ...item, ...updates });

      if (typeof merged.quantity === 'number' && hasFiniteStockLimit(merged)) {
        merged.quantity = Math.min(Math.max(merged.quantity, 1), merged.stockQuantity);
      }

      return merged;
    }
    return item;
  });
  setCart(items);
  return items;
};

/**
 * Remove item from cart
 * @param {number} id - Item ID
 * @param {string} type - Item type ('menu' or 'combo')
 * @returns {Array} Updated cart
 */
export const removeCartItem = (id, type, cartItemKey = '') => {
  const targetKey = String(cartItemKey || '').trim();
  const items = getCart().filter((item) => {
    if (targetKey) {
      return String(item?.cartItemKey || '').trim() !== targetKey;
    }

    return !(item.id === id && item.type === type);
  });
  setCart(items);
  return items;
};

/**
 * Clear entire cart
 */
export const clearCart = () => {
  localStorage.removeItem(STORAGE_KEY);
  emitCartUpdate();
};

/**
 * Get cart summary
 * Calculates subtotal, item count, etc.
 * @returns {Object} Cart summary
 */
export const getCartSummary = () => {
  const items = getCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    itemCount,
    itemTotal: items.length,
    subtotal: parseFloat(subtotal.toFixed(2)),
    isEmpty: items.length === 0,
    items
  };
};

/**
 * Check if cart is empty
 * @returns {boolean}
 */
export const isCartEmpty = () => {
  return getCart().length === 0;
};

/**
 * Get cart total for a specific order type
 * @param {string} orderType - 'DELIVERY' or 'TAKEAWAY'
 * @returns {Object} Total breakdown
 */
export const getCartTotal = (orderType = 'DELIVERY') => {
  const items = getCart();
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = orderType === 'DELIVERY' ? 150 : 0;
  const total = subtotal + deliveryFee;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

