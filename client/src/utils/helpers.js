// Utility functions for the application

// Format currency
// Code Review: Function formatCurrency in client\src\utils\helpers.js. Used in: client/src/pages/SalesAnalytics.jsx, client/src/utils/helpers.js, client/src/utils/posReceiptPrint.js.
export const formatCurrency = (amount) => {
  // Always format as LKR and round to nearest integer for food prices
  return `LKR ${Math.round(amount)}`;
};

// Format date
// Code Review: Function formatDate in client\src\utils\helpers.js. Used in: client/src/components/ComboPackCard.jsx, client/src/pages/CustomerManagement.jsx, client/src/pages/StaffManagement.jsx.
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
// Code Review: Function formatTime in client\src\utils\helpers.js. Used in: client/src/components/ui/NotificationCenter.jsx, client/src/pages/ResetPassword.jsx, client/src/pages/VerifyAccount.jsx.
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-LK', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date and time
// Code Review: Function formatDateTime in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js, client/src/utils/posReceiptPrint.js.
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
// Code Review: Function validateEmail in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js, server/utils/validationUtils.js.
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
// Code Review: Function validatePhone in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Calculate delivery fee
// Code Review: Function calculateDeliveryFee in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js, server/controllers/deliveryController.js, server/routes/deliveryRoutes.js.
export const calculateDeliveryFee = (distance) => {
  // Use LKR values for delivery fee
  if (distance <= 2) return 100;
  if (distance <= 5) return 200;
  return 300;
};

// Generate order number
// Code Review: Function generateOrderNumber in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js, server/services/orderService.js.
export const generateOrderNumber = () => {
  return Math.floor(Math.random() * 1000000) + 100000;
};

// Debounce function
// Code Review: Function debounce in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    // Code Review: Function later in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js, server/middleware/rateLimiter.js, server/routes/customers.js.
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
// Code Review: Function throttle in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
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
// Code Review: Function scrollToTop in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// Copy to clipboard
// Code Review: Function copyToClipboard in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
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
// Code Review: Function getOrderStatusColor in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
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
// Code Review: Function getOrderStatusText in client\src\utils\helpers.js. Used in: client/src/utils/helpers.js.
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
