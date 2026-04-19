// Utility functions for the application

// Format currency
// Simple: This cleans or formats the currency.
export const formatCurrency = (amount) => {
  // Always format as LKR and round to nearest integer for food prices
  return `LKR ${Math.round(amount)}`;
};

// Format date
// Simple: This cleans or formats the date.
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
// Simple: This cleans or formats the time.
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date and time
// Simple: This cleans or formats the date time.
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validate email
// Simple: This checks if the email is correct.
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
// Simple: This checks if the phone is correct.
export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Calculate delivery fee
// Simple: This calculates the delivery fee.
export const calculateDeliveryFee = (distance) => {
  // Use LKR values for delivery fee
  if (distance <= 2) return 100;
  if (distance <= 5) return 200;
  return 300;
};

// Generate order number
// Simple: This creates the order number.
export const generateOrderNumber = () => {
  return Math.floor(Math.random() * 1000000) + 100000;
};

// Debounce function
// Simple: This handles debounce logic.
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    // Simple: This handles later logic.
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
// Simple: This handles throttle logic.
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Local storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

// Scroll to top
// Simple: This handles scroll to top logic.
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// Copy to clipboard
// Simple: This handles copy to clipboard logic.
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Get order status color
// Simple: This gets the order status color.
export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'text-yellow-600 bg-yellow-100',
    preparing: 'text-blue-600 bg-blue-100',
    out_for_delivery: 'text-purple-600 bg-purple-100',
    delivered: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

// Get order status text
// Simple: This gets the order status text.
export const getOrderStatusText = (status) => {
  const texts = {
    pending: 'Order Received',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return texts[status] || status;
};
