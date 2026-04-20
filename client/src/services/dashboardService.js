// CODEMAP: FRONTEND_SERVICE_DASHBOARD
// PURPOSE: Frontend API layer for admin, cashier, kitchen, and delivery dashboard actions.
// SEARCH_HINT: Start here to trace which backend endpoint a dashboard button or widget calls.
import { API_BASE_URL } from '../config/api';

/**
 * Get authentication headers
 */
// Simple: Build auth headers for protected backend endpoints.
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
// Simple: Standardize error handling for all dashboard fetch calls.
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
  // Simple: Load top dashboard counters for admin home.
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Get sales report using either custom date range or month/year filters.
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

  // Simple: Convenience wrapper for monthly sales view.
  async getMonthlySalesReport(year, month) {
    return this.getSalesReport({ year, month });
  }

  // Simple: Get top-selling items with optional date filter.
  async getBestSellingItems(limit = 10, startDate, endDate) {
    let url = `${API_BASE_URL}/api/v1/admin/reports/best-selling?limit=${encodeURIComponent(limit)}`;
    if (startDate && endDate) {
      url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  // Simple: Get customer retention metrics for analytics screen.
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

  // Simple: Get full business summary report for admin exports and charts.
  async getBusinessSummaryReport(params = {}) {
    const query = new URLSearchParams();

    if (params.startDate && params.endDate) {
      query.set('startDate', params.startDate);
      query.set('endDate', params.endDate);
    } else {
      query.set('year', String(params.year));
      query.set('month', String(params.month));
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/reports/business-summary?${query.toString()}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  // Simple: Read current admin system settings.
  async getSettings() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Save admin system settings changes.
  async updateSettings(settings) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(response);
  }

  // Simple: Fetch all staff records for admin management page.
  async getAllStaff() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Create a new staff account.
  async createStaff(staffData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(response);
  }

  // Simple: Update one staff account by ID.
  async updateStaff(id, staffData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(staffData)
    });
    return handleResponse(response);
  }

  // Simple: Remove one staff account by ID.
  async deleteStaff(id) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Get list of available role definitions.
  async getAllRoles() {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Manually assign a delivery rider to an order.
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
  // Simple: Load cashier dashboard counters.
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Load cashier order list with optional filters and paging.
  async getAllOrders(filters = {}) {
    const query = new URLSearchParams();

    if (filters.status) query.set('status', String(filters.status));
    if (filters.limit != null) query.set('limit', String(filters.limit));
    if (filters.offset != null) query.set('offset', String(filters.offset));
    if (filters.page != null) query.set('page', String(filters.page));
    if (filters.search) query.set('search', String(filters.search));
    if (filters.includeItems != null) query.set('includeItems', String(filters.includeItems));
    if (filters.startDate && filters.endDate) {
      query.set('startDate', String(filters.startDate));
      query.set('endDate', String(filters.endDate));
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/orders${suffix}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  // Simple: Get printable receipt data for one order.
  async getOrderReceipt(orderId, terminalId = '') {
    const query = new URLSearchParams();
    if (terminalId) {
      query.set('terminalId', terminalId);
    }

    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/orders/${orderId}/receipt${suffix}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Create a walk-in order from POS.
  async createWalkInOrder(orderData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/walkin-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    return handleResponse(response);
  }

  // Simple: Load menu items shown in POS.
  async getMenuItemsForPos() {
    const response = await fetch(`${API_BASE_URL}/api/v1/menu?isActive=true&_=${Date.now()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse(response);
  }

  // Simple: Load combo packs shown in POS.
  async getComboPacksForPos() {
    const response = await fetch(`${API_BASE_URL}/api/v1/combos/active?_=${Date.now()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    return handleResponse(response);
  }

  // Simple: Confirm an order from cashier flow.
  async confirmOrder(orderId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/orders/${orderId}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Cancel an order from cashier flow with reason.
  async cancelOrder(orderId, reason) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(response);
  }

  // Simple: Search customers from cashier screen.
  async getAllCustomers(search = '', limit = 50) {
    const query = new URLSearchParams({
      search,
      limit: String(limit)
    });

    const response = await fetch(
      `${API_BASE_URL}/api/v1/cashier/customers?${query.toString()}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  // Simple: Get one customer profile by ID.
  async getCustomerById(customerId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/customers/${customerId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Register a new customer from cashier flow.
  async registerCustomer(customerData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/cashier/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customerData)
    });
    return handleResponse(response);
  }

  // Simple: Update customer profile from cashier flow.
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
  // Simple: Load kitchen dashboard counters.
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Load kitchen order queue, optionally by status.
  async getAssignedOrders(status = '') {
    let url = `${API_BASE_URL}/api/v1/kitchen/orders`;
    if (status) url += `?status=${status}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  // Simple: Update kitchen order status (for example confirmed to preparing).
  async updateOrderStatus(orderId, status) {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  }

  // Simple: Load all menu items relevant for kitchen stock operations.
  async getAllMenuItems() {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/menu-items`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Load daily stock records, optionally for a selected date.
  async getDailyStock(date = '') {
    let url = `${API_BASE_URL}/api/v1/kitchen/stock/daily`;
    if (date) url += `?date=${date}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  // Simple: Update one daily stock record.
  async updateDailyStock(stockData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/kitchen/stock/daily`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(stockData)
    });
    return handleResponse(response);
  }

  // Simple: Update many daily stock records in one request.
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
  // Simple: Load delivery dashboard counters.
  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Load rider deliveries, optionally filtered by status.
  async getMyDeliveries(status = '') {
    let url = `${API_BASE_URL}/api/v1/delivery/deliveries`;
    if (status) url += `?status=${status}`;

    const response = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(response);
  }

  // Simple: Get one delivery record by ID.
  async getDeliveryById(deliveryId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/deliveries/${deliveryId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }

  // Simple: Update delivery status (picked up, in transit, delivered, failed).
  async updateDeliveryStatus(deliveryId, statusData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData)
    });
    return handleResponse(response);
  }

  // Simple: Load delivery history with paging.
  async getDeliveryHistory(limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/delivery/history?limit=${limit}&offset=${offset}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  }

  // Simple: Set rider availability for new assignments.
  async updateAvailability(isAvailable) {
    const response = await fetch(`${API_BASE_URL}/api/v1/delivery/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isAvailable })
    });
    return handleResponse(response);
  }

  // Simple: Get rider availability state.
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
