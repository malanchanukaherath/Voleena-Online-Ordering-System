const STORAGE_KEY = 'voleena_cart';

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

export const setCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const addToCart = (item, quantity = 1) => {
  const items = getCart();
  const existingIndex = items.findIndex((entry) => entry.id === item.id && entry.type === item.type);

  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }

  setCart(items);
  return items;
};

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

export const removeCartItem = (id, type) => {
  const items = getCart().filter((item) => !(item.id === id && item.type === type));
  setCart(items);
  return items;
};

export const clearCart = () => {
  localStorage.removeItem(STORAGE_KEY);
};
