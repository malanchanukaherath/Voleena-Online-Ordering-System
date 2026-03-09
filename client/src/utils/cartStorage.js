/**
 * Cart Storage Utility
 * Manages shopping cart persistence using localStorage
 * Supports both menu items and combo packs
 */

const STORAGE_KEY = 'voleena_cart';

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
    return Array.isArray(items) ? items : [];
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

  const items = getCart();
  const existingIndex = items.findIndex(
    (entry) => entry.id === item.id && entry.type === item.type
  );

  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({
      id: item.id,
      type: item.type,
      name: item.name,
      price: item.price,
      image: item.image || null,
      notes: '',
      quantity,
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
export const updateCartItem = (id, type, updates) => {
  const items = getCart().map((item) => {
    if (item.id === id && item.type === type) {
      return { ...item, ...updates };
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
export const removeCartItem = (id, type) => {
  const items = getCart().filter((item) => !(item.id === id && item.type === type));
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
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + deliveryFee + tax;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
};

