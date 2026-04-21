const request = require('supertest');

jest.mock('../middleware/auth', () => require('./helpers/mockAuth'));
jest.mock('../middleware/upload', () => ({
  single: () => (req, res, next) => next()
}));

// Simple: This handles mock ok handler logic.
function mockOkHandler(req, res) {
  res.status(200).json({ success: true, route: req.path, method: req.method });
}

jest.mock('../controllers/adminController', () => ({
  getDashboardStats: mockOkHandler,
  getMonthlySalesReport: mockOkHandler,
  getBestSellingItems: mockOkHandler,
  getCustomerRetentionReport: mockOkHandler,
  getBusinessSummaryReport: mockOkHandler,
  getSystemSettings: mockOkHandler,
  updateSystemSettings: mockOkHandler,
  getAllStaff: mockOkHandler,
  createStaff: mockOkHandler,
  updateStaff: mockOkHandler,
  deleteStaff: mockOkHandler,
  getAllRoles: mockOkHandler,
  assignDeliveryStaff: mockOkHandler
}));

jest.mock('../controllers/feedbackController', () => ({
  getAdminFeedback: mockOkHandler,
  respondToFeedback: mockOkHandler
}));

jest.mock('../controllers/kitchenController', () => ({
  getDashboardStats: mockOkHandler,
  getAssignedOrders: mockOkHandler,
  updateOrderStatus: mockOkHandler,
  getAllMenuItems: mockOkHandler,
  getDailyStock: mockOkHandler,
  updateDailyStock: mockOkHandler,
  bulkUpdateDailyStock: mockOkHandler
}));

jest.mock('../controllers/cashierController', () => ({
  getDashboardStats: mockOkHandler,
  getAllOrders: mockOkHandler,
  getOrderReceipt: mockOkHandler,
  createWalkInOrder: mockOkHandler,
  confirmOrder: mockOkHandler,
  cancelOrder: mockOkHandler,
  getAllCustomers: mockOkHandler,
  getCustomerById: mockOkHandler,
  registerCustomer: mockOkHandler,
  updateCustomer: mockOkHandler
}));

jest.mock('../controllers/stockController', () => ({
  updateOpeningQuantity: mockOkHandler,
  manualAdjustStock: mockOkHandler,
  getTodayStock: mockOkHandler,
  getStockMovements: mockOkHandler,
  deleteStockRecord: mockOkHandler,
  setOpeningStock: mockOkHandler,
  bulkSetOpeningStock: mockOkHandler,
  adjustStock: mockOkHandler
}));

jest.mock('../controllers/menuItemController', () => ({
  createMenuItem: mockOkHandler,
  getAllMenuItems: mockOkHandler,
  getAddOnCatalog: mockOkHandler,
  createAddOnCatalogItem: mockOkHandler,
  updateAddOnCatalogItem: mockOkHandler,
  deactivateAddOnCatalogItem: mockOkHandler,
  getMenuItemAddOnConfig: mockOkHandler,
  updateMenuItemAddOnConfig: mockOkHandler,
  getMenuItem: mockOkHandler,
  updateMenuItem: mockOkHandler,
  deleteMenuItem: mockOkHandler,
  uploadImage: mockOkHandler
}));

jest.mock('../controllers/comboPackController', () => ({
  createComboPack: mockOkHandler,
  getAllComboPacks: mockOkHandler,
  getActiveComboPacks: mockOkHandler,
  getComboPack: mockOkHandler,
  updateComboPack: mockOkHandler,
  deleteComboPack: mockOkHandler,
  uploadImage: mockOkHandler
}));

jest.mock('../controllers/uploadController', () => ({
  getUploadFolders: mockOkHandler,
  uploadImage: mockOkHandler
}));

jest.mock('../controllers/notificationController', () => ({
  getMyNotifications: mockOkHandler,
  getUnreadCount: mockOkHandler,
  markOneAsRead: mockOkHandler,
  markAllAsRead: mockOkHandler,
  deleteOne: mockOkHandler,
  clearAll: mockOkHandler
}));

const { resetAuthState, setAuthMode, setAuthUser } = require('./helpers/mockAuth');
const createTestApp = require('./helpers/createTestApp');

const routerDefinitions = [
  {
    prefix: '/api/v1/admin',
    router: require('../routes/adminRoutes'),
    protectedEndpoints: [
      ['get', '/dashboard/stats'],
      ['get', '/reports/monthly-sales'],
      ['get', '/reports/best-selling'],
      ['get', '/reports/customer-retention'],
      ['get', '/reports/business-summary'],
      ['get', '/staff'],
      ['post', '/staff'],
      ['put', '/staff/1'],
      ['delete', '/staff/1'],
      ['get', '/roles'],
      ['post', '/delivery/assign']
    ]
  },
  {
    prefix: '/api/v1/kitchen',
    router: require('../routes/kitchenRoutes'),
    protectedEndpoints: [
      ['get', '/dashboard/stats'],
      ['get', '/orders'],
      ['put', '/orders/1/status'],
      ['get', '/menu-items'],
      ['get', '/stock/daily'],
      ['post', '/stock/daily'],
      ['post', '/stock/daily/bulk']
    ]
  },
  {
    prefix: '/api/v1/cashier',
    router: require('../routes/cashierRoutes'),
    protectedEndpoints: [
      ['get', '/dashboard/stats'],
      ['get', '/orders'],
      ['get', '/orders/1/receipt'],
      ['post', '/walkin-order'],
      ['put', '/orders/1/confirm'],
      ['put', '/orders/1/cancel'],
      ['get', '/customers'],
      ['get', '/customers/1'],
      ['post', '/customers'],
      ['put', '/customers/1']
    ]
  },
  {
    prefix: '/api/v1/stock',
    router: require('../routes/stock'),
    protectedEndpoints: [
      ['put', '/update/1'],
      ['post', '/manual-adjust/1'],
      ['get', '/today'],
      ['get', '/movements'],
      ['delete', '/1'],
      ['post', '/daily'],
      ['post', '/daily/bulk'],
      ['patch', '/daily/1']
    ]
  },
  {
    prefix: '/api/v1/menu',
    router: require('../routes/menuItems'),
    protectedEndpoints: [
      ['post', '/'],
      ['get', '/addons/catalog'],
      ['post', '/addons/catalog'],
      ['put', '/addons/catalog/add_cheese'],
      ['delete', '/addons/catalog/add_cheese'],
      ['get', '/1/addons-config'],
      ['put', '/1/addons-config'],
      ['put', '/1'],
      ['delete', '/1'],
      ['post', '/1/image']
    ],
    publicEndpoints: [
      ['get', '/'],
      ['get', '/1']
    ]
  },
  {
    prefix: '/api/v1/combos',
    router: require('../routes/comboPacks'),
    protectedEndpoints: [
      ['post', '/'],
      ['get', '/'],
      ['get', '/1'],
      ['put', '/1'],
      ['delete', '/1'],
      ['post', '/1/image']
    ],
    publicEndpoints: [
      ['get', '/active']
    ]
  },
  {
    prefix: '/api/v1/upload',
    router: require('../routes/uploadRoutes'),
    protectedEndpoints: [
      ['get', '/folders'],
      ['post', '/image']
    ]
  },
  {
    prefix: '/api/v1/notifications',
    router: require('../routes/notifications'),
    protectedEndpoints: [
      ['get', '/'],
      ['get', '/unread-count'],
      ['patch', '/read-all'],
      ['patch', '/123/read'],
      ['delete', '/123'],
      ['delete', '/']
    ]
  }
];

describe('route contracts', () => {
  beforeEach(() => {
    resetAuthState();
    setAuthUser({ type: 'Staff', role: 'Admin' });
  });

  test.each(routerDefinitions.flatMap((definition) =>
    definition.protectedEndpoints.map(([method, path]) => [definition, method, path])
  ))('allows protected endpoint %s %s for authorized users', async (definition, method, path) => {
    const app = createTestApp(definition.prefix, definition.router);
    const response = await request(app)[method](`${definition.prefix}${path}`).send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test.each(routerDefinitions.flatMap((definition) =>
    definition.protectedEndpoints.map(([method, path]) => [definition, method, path])
  ))('rejects protected endpoint %s %s when unauthenticated', async (definition, method, path) => {
    resetAuthState();
    setAuthMode('unauthorized');
    const app = createTestApp(definition.prefix, definition.router);
    const response = await request(app)[method](`${definition.prefix}${path}`).send({});

    expect(response.status).toBe(401);
  });

  test.each(routerDefinitions.flatMap((definition) =>
    (definition.publicEndpoints || []).map(([method, path]) => [definition, method, path])
  ))('keeps public endpoint %s %s accessible without auth', async (definition, method, path) => {
    resetAuthState();
    setAuthMode('unauthorized');
    const app = createTestApp(definition.prefix, definition.router);
    const response = await request(app)[method](`${definition.prefix}${path}`).send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});



