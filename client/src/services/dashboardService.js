import { API_BASE_URL } from '../config/api';

/**
 * Get authentication headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Admin Dashboard Service
 */
class AdminService {
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async getSalesReport(params = {}) {
    const query = new URLSearchParams();

    if (params.startDate && params.endDate) {
      query.set('startDate', params.startDate);
      query.set('endDate', params.endDate);
    } else {
      query.set('year', String(params.year));
      query.set('month', String(params.month));
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/reports/monthly-sales?${query.toString()}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  async getMonthlySalesReport(year, month) {
    return this.getSalesReport({ year, month });
  }

  async getBestSellingItems(limit = 10, startDate, endDate) {
    let url = `${API_BASE_URL}/api/v1/admin/reports/best-selling?limit=${encodeURIComponent(limit)}`;
    if (startDate && endDate) {
      url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  async getCustomerRetention(params = {}) {
    const query = new URLSearchParams();

    if (params.startDate && params.endDate) {
      query.set('startDate', params.startDate);
      query.set('endDate', params.endDate);
    } else {
      query.set('year', String(params.year));
      query.set('month', String(params.month));
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/reports/customer-retention?${query.toString()}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  async getAllStaff() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async createStaff(staffData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(response);
  }

  async updateStaff(id, staffData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(response);
  }

  async deleteStaff(id) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async getAllRoles() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async assignDeliveryStaff(orderId, staffId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/delivery/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderId, staffId })
    });
    return handleResponse(response);
  }
}

/**
 * Cashier Dashboard Service
 */
class CashierService {
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async getAllOrders(filters = {}) {
    let url = `${API_BASE_URL}/api/v1/cashier/orders?`;
    if (filters.status) url += `status=${filters.status}&`;
    if (filters.limit) url += `limit=${filters.limit}&`;
    if (filters.startDate && filters.endDate) {
      url += `startDate=${filters.startDate}&endDate=${filters.endDate}`;
    }

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  async createWalkInOrder(orderData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/walkin-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    return handleResponse(response);
  }

  async getMenuItemsForPos() {
    const response = await fetch(`${API_BASE_URL}/api/v1/menu?isActive=true&_=${Date.now()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse(response);
  }

  async getComboPacksForPos() {
    const response = await fetch(`${API_BASE_URL}/api/v1/combos/active?_=${Date.now()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse(response);
  }

  async confirmOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/orders/${orderId}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async cancelOrder(orderId, reason) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(response);
  }

  async getAllCustomers(search = '', limit = 50) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/cashier/customers?search=${search}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  async getCustomerById(customerId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/customers/${customerId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async registerCustomer(customerData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    });
    return handleResponse(response);
  }

  async updateCustomer(customerId, customerData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/customers/${customerId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    });
    return handleResponse(response);
  }
}

/**
 * Kitchen Dashboard Service
 */
class KitchenService {
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async getAssignedOrders(status = '') {
    let url = `${API_BASE_URL}/api/v1/kitchen/orders`;
    if (status) url += `?status=${status}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  async updateOrderStatus(orderId, status) {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  }

  async getAllMenuItems() {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/menu-items`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async getDailyStock(date = '') {
    let url = `${API_BASE_URL}/api/v1/kitchen/stock/daily`;
    if (date) url += `?date=${date}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  async updateDailyStock(stockData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/stock/daily`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(stockData)
    });
    return handleResponse(response);
  }

  async bulkUpdateDailyStock(items) {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/stock/daily/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items })
    });
    return handleResponse(response);
  }
}

/**
 * Delivery Dashboard Service
 */
class DeliveryService {
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async getMyDeliveries(status = '') {
    let url = `${API_BASE_URL}/api/v1/delivery/deliveries`;
    if (status) url += `?status=${status}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  async getDeliveryById(deliveryId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/deliveries/${deliveryId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  async updateDeliveryStatus(deliveryId, statusData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData)
    });
    return handleResponse(response);
  }

  async getDeliveryHistory(limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/delivery/history?limit=${limit}&offset=${offset}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  async updateAvailability(isAvailable) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isAvailable })
    });
    return handleResponse(response);
  }

  async getAvailability() {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/availability`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  /**
   * Track delivery rider's current location
   */
  async trackDeliveryLocation(deliveryId, { lat, lng }) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/deliveries/${deliveryId}/location`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lat, lng })
    });
    return handleResponse(response);
  }

  /**
   * Get delivery's live location (for admin/customer tracking)
   */
  async getDeliveryLocation(deliveryId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/deliveries/${deliveryId}/location`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
}

// Export service instances
export const adminService = new AdminService();
export const cashierService = new CashierService();
export const kitchenService = new KitchenService();
export const deliveryService = new DeliveryService();
