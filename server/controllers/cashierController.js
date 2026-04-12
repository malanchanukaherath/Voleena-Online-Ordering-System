const { Order, Customer, OrderItem, MenuItem, ComboPack, Delivery, Address, OrderStatusHistory, Payment, Staff, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const orderService = require('../services/orderService');

const DEFAULT_STORE_NAME = process.env.POS_STORE_NAME || 'Voleena Foods';
const DEFAULT_STORE_ADDRESS = process.env.POS_STORE_ADDRESS || 'Store Address Not Configured';
const DEFAULT_STORE_CONTACT = process.env.POS_STORE_CONTACT || 'N/A';
const DEFAULT_TERMINAL_ID = process.env.POS_TERMINAL_ID || 'WEB-POS-1';

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositiveNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const getOrderCreatedAt = (order) => order?.created_at || order?.CreatedAt || order?.createdAt || new Date();

const buildReceiptPayload = (order, options = {}) => {
  const subtotal = toFiniteNumber(order?.TotalAmount, 0);
  const discount = toFiniteNumber(order?.DiscountAmount, 0);
  const deliveryFee = toFiniteNumber(order?.DeliveryFee, 0);
  const tax = 0;
  const total = toFiniteNumber(order?.FinalAmount, Math.max((subtotal - discount) + deliveryFee + tax, 0));
  const paidAmountFromPayment = toFiniteNumber(order?.payment?.Amount, total);
  const amountReceived = toFiniteNumber(
    options.amountReceived,
    paidAmountFromPayment
  );
  const change = toFiniteNumber(
    options.change,
    Math.max(amountReceived - total, 0)
  );

  return {
    receiptNumber: order?.OrderNumber || `OID-${order?.OrderID || 'N/A'}`,
    orderId: order?.OrderID || null,
    orderNumber: order?.OrderNumber || null,
    orderType: order?.OrderType || null,
    printedAt: new Date().toISOString(),
    orderCreatedAt: getOrderCreatedAt(order),
    terminalId: options.terminalId || DEFAULT_TERMINAL_ID,
    cashierName: options.cashierName || order?.confirmer?.Name || 'Cashier',
    customer: {
      id: order?.customer?.CustomerID || null,
      name: order?.customer?.Name || 'Walk-in Customer',
      phone: order?.customer?.Phone || '',
      email: order?.customer?.Email || ''
    },
    store: {
      name: DEFAULT_STORE_NAME,
      address: DEFAULT_STORE_ADDRESS,
      contact: DEFAULT_STORE_CONTACT
    },
    items: (order?.items || []).map((item) => {
      const unitPrice = toFiniteNumber(item?.UnitPrice, toFiniteNumber(item?.menuItem?.Price, toFiniteNumber(item?.combo?.Price, 0)));
      const quantity = Number.parseInt(item?.Quantity, 10) || 0;

      return {
        orderItemId: item?.OrderItemID || null,
        menuItemId: item?.MenuItemID || null,
        comboId: item?.ComboID || null,
        name: item?.menuItem?.Name || item?.combo?.Name || 'Item',
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice
      };
    }),
    pricing: {
      subtotal,
      discount,
      tax,
      deliveryFee,
      total,
      amountReceived,
      change
    },
    payment: {
      paymentId: order?.payment?.PaymentID || null,
      method: order?.payment?.Method || 'N/A',
      status: order?.payment?.Status || 'PENDING',
      paidAt: order?.payment?.PaidAt || null,
      amount: paidAmountFromPayment
    }
  };
};

const isAddressTableMissingError = (error) => {
  const mysqlCode = error?.original?.code || error?.parent?.code;
  const message = [error?.message, error?.original?.sqlMessage, error?.parent?.sqlMessage]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return mysqlCode === 'ER_NO_SUCH_TABLE' && message.includes('address')
    || (message.includes('no such table') && message.includes('address'))
    || (message.includes("doesn't exist") && message.includes('address'));
};

const DEFAULT_GUEST_NAME = 'Walk-in Customer';
const DEFAULT_GUEST_PHONE = process.env.WALKIN_GUEST_PHONE || '7000000000';

async function findOrCreateGuestCustomer() {
  const existingGuest = await Customer.findOne({
    where: {
      Name: DEFAULT_GUEST_NAME,
      Phone: DEFAULT_GUEST_PHONE
    }
  });

  if (existingGuest) {
    return existingGuest;
  }

  const fallbackPassword = `${crypto.randomBytes(8).toString('hex')}A1!`;

  return Customer.create({
    Name: DEFAULT_GUEST_NAME,
    Email: null,
    Phone: DEFAULT_GUEST_PHONE,
    Password: fallbackPassword,
    AccountStatus: 'ACTIVE',
    IsEmailVerified: false,
    IsPhoneVerified: false,
    PreferredNotification: 'SMS'
  });
}

async function resolveWalkInCustomer(rawCustomerId) {
  const customerId = Number.parseInt(rawCustomerId, 10);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    const error = new Error('Invalid customer id');
    error.statusCode = 400;
    throw error;
  }

  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  if (customer.AccountStatus !== 'ACTIVE' || customer.IsActive === false) {
    const error = new Error('Selected customer is not active');
    error.statusCode = 400;
    throw error;
  }

  return customer;
}

/**
 * Get cashier dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { Op } = sequelize.Sequelize;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pending orders
    const pendingOrders = await Order.count({
      where: { Status: 'PENDING' }
    });

    // Today's orders
    const todayOrders = await Order.count({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    // Today's revenue
    const todayRevenue = await Order.sum('final_amount', {
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: today
        },
        Status: {
          [sequelize.Sequelize.Op.not]: 'CANCELLED'
        }
      }
    });

    // New customers today
    const newCustomers = await Customer.count({
      where: {
        created_at: {
          [Op.gte]: today
        }
      }
    });

    // Today's walk-in orders
    const walkInOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: today
        },
        OrderType: 'WALK_IN'
      }
    });

    // Today's online-channel orders (keeps legacy DELIVERY/TAKEAWAY compatible)
    const onlineOrders = await Order.count({
      where: {
        created_at: {
          [Op.gte]: today
        },
        OrderType: {
          [Op.in]: ['ONLINE', 'DELIVERY', 'TAKEAWAY']
        }
      }
    });

    return res.json({
      success: true,
      stats: {
        pendingOrders,
        todayOrders,
        todayRevenue: todayRevenue || 0,
        newCustomers,
        walkInOrders,
        onlineOrders
      }
    });
  } catch (error) {
    console.error('Cashier dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Create walk-in order from cashier dashboard
 */
exports.createWalkInOrder = async (req, res) => {
  try {
    const {
      items,
      payment_method: paymentMethod,
      special_instructions: specialInstructions,
      customer_id: customerIdFromSnakeCase,
      customerId: customerIdFromCamelCase,
      amount_received: amountReceivedFromSnakeCase,
      amountReceived: amountReceivedFromCamelCase,
      change_amount: changeAmountFromSnakeCase,
      changeAmount: changeAmountFromCamelCase,
      terminal_id: terminalIdFromSnakeCase,
      terminalId: terminalIdFromCamelCase
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const normalizedPaymentMethod = String(paymentMethod || 'CASH').toUpperCase();
    const allowedPaymentMethods = ['CASH', 'CARD', 'ONLINE', 'WALLET'];
    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const normalizedItems = items.map((item) => {
      const rawMenuItemId = item.menuItemId ?? item.menu_item_id;
      const rawComboId = item.comboId ?? item.combo_id;

      return {
        menuItemId: rawMenuItemId != null ? Number.parseInt(rawMenuItemId, 10) : null,
        comboId: rawComboId != null ? Number.parseInt(rawComboId, 10) : null,
        quantity: Number.parseInt(item.quantity, 10) || 0,
        notes: item.notes || item.item_notes || null
      };
    });

    const hasInvalidItem = normalizedItems.some((item) => {
      const hasSelectableItem = Number.isInteger(item.menuItemId) || Number.isInteger(item.comboId);
      return !hasSelectableItem || item.quantity < 1;
    });

    if (hasInvalidItem) {
      return res.status(400).json({
        error: 'Each item must include a valid menu_item_id or combo_id and quantity greater than 0'
      });
    }

    const requestedCustomerId = customerIdFromSnakeCase ?? customerIdFromCamelCase;
    const orderCustomer = requestedCustomerId != null
      ? await resolveWalkInCustomer(requestedCustomerId)
      : await findOrCreateGuestCustomer();

    const order = await orderService.createOrder(orderCustomer.CustomerID, {
      orderType: 'WALK_IN',
      specialInstructions: specialInstructions || null,
      items: normalizedItems
    });

    if (
      Number.isInteger(req.user?.id)
      && req.user?.type === 'Staff'
      && order?.Status === 'CONFIRMED'
    ) {
      await Order.update(
        { ConfirmedBy: req.user.id },
        {
          where: {
            OrderID: order.OrderID,
            ConfirmedBy: null
          }
        }
      );
    }

    const amount = Number(order.FinalAmount ?? order.TotalAmount ?? 0);
    const isPaidAtCounter = normalizedPaymentMethod === 'CASH';

    await Payment.create({
      OrderID: order.OrderID,
      Amount: amount,
      Method: normalizedPaymentMethod,
      Status: isPaidAtCounter ? 'PAID' : 'PENDING',
      PaidAt: isPaidAtCounter ? new Date() : null,
      GatewayStatus: isPaidAtCounter ? 'PAID_AT_COUNTER' : 'PENDING'
    });

    const completeOrder = await Order.findByPk(order.OrderID, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['CustomerID', 'Name', 'Email', 'Phone']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['PaymentID', 'Method', 'Status', 'Amount', 'PaidAt']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem',
            attributes: ['MenuItemID', 'Name', 'Price']
          }, {
            model: ComboPack,
            as: 'combo',
            attributes: ['ComboID', 'Name', 'Price']
          }]
        },
        {
          model: Staff,
          as: 'confirmer',
          attributes: ['StaffID', 'Name']
        }
      ]
    });

    const amountReceived = toPositiveNumberOrNull(amountReceivedFromSnakeCase ?? amountReceivedFromCamelCase);
    const changeAmount = toPositiveNumberOrNull(changeAmountFromSnakeCase ?? changeAmountFromCamelCase);
    const terminalId = String(terminalIdFromSnakeCase ?? terminalIdFromCamelCase ?? '').trim();
    const cashierName = String(req.user?.name || '').trim() || 'Cashier';

    const receipt = buildReceiptPayload(completeOrder, {
      amountReceived,
      change: changeAmount,
      terminalId: terminalId || DEFAULT_TERMINAL_ID,
      cashierName
    });

    return res.status(201).json({
      success: true,
      message: 'Walk-in order created and sent to kitchen',
      data: completeOrder,
      receipt
    });
  } catch (error) {
    console.error('Create walk-in order error:', error);
    const errorMessage = error.message || 'Failed to create walk-in order';
    const statusCode = error.statusCode
      || (/required|invalid|available|stock|outside|at least one item|not active/i.test(errorMessage)
        ? 400
        : /not found/i.test(errorMessage)
          ? 404
          : 500);

    return res.status(statusCode).json({ error: errorMessage });
  }
};

/**
 * Get all orders with customer details
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 200);

    const where = {};

    if (status) {
      where.Status = status;
    }

    if (startDate && endDate) {
      where.created_at = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['CustomerID', 'Name', 'Email', 'Phone']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem',
            attributes: ['MenuItemID', 'Name', 'Price']
          }, {
            model: ComboPack,
            as: 'combo',
            attributes: ['ComboID', 'Name', 'Price']
          }]
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['PaymentID', 'Method', 'Status', 'Amount', 'PaidAt']
        }
      ],
      order: [
        // Prioritize action-required statuses: Show newest orders first
        // (Orders are auto-confirmed now, so PENDING status rarely occurs)
        sequelize.literal("CASE WHEN `Order`.Status = 'PENDING' THEN 0 WHEN `Order`.Status = 'CONFIRMED' THEN 1 ELSE 2 END"),
        // Then show newest orders first
        ['created_at', 'DESC']
      ],
      limit: safeLimit
    });

    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * Get full receipt data for a specific order id (manual reprint support)
 */
exports.getOrderReceipt = async (req, res) => {
  try {
    const parsedOrderId = Number.parseInt(req.params.orderId, 10);

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      return res.status(400).json({ error: 'Invalid order id' });
    }

    const terminalIdFromQuery = String(req.query?.terminalId || '').trim();
    const order = await Order.findByPk(parsedOrderId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['CustomerID', 'Name', 'Email', 'Phone']
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['PaymentID', 'Method', 'Status', 'Amount', 'PaidAt']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem',
            attributes: ['MenuItemID', 'Name', 'Price']
          }, {
            model: ComboPack,
            as: 'combo',
            attributes: ['ComboID', 'Name', 'Price']
          }]
        },
        {
          model: Staff,
          as: 'confirmer',
          attributes: ['StaffID', 'Name']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const receipt = buildReceiptPayload(order, {
      terminalId: terminalIdFromQuery || DEFAULT_TERMINAL_ID,
      cashierName: order?.confirmer?.Name || String(req.user?.name || '').trim() || 'Cashier'
    });

    return res.json({
      success: true,
      data: order,
      receipt
    });
  } catch (error) {
    console.error('Get order receipt error:', error);
    return res.status(500).json({ error: 'Failed to fetch receipt data' });
  }
};

/**
 * Accept/Confirm an order
 * NOTE: Orders are now auto-confirmed on creation. This endpoint is maintained for backward compatibility.
 */
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const staffId = req.user.id;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Orders are now auto-confirmed, return success if already confirmed
    if (order.Status === 'CONFIRMED') {
      return res.json({
        success: true,
        message: 'Order is already confirmed',
        data: order
      });
    }

    if (order.Status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending orders can be confirmed' });
    }

    await order.update({
      Status: 'CONFIRMED',
      ConfirmedAt: new Date(),
      ConfirmedBy: staffId
    });

    await OrderStatusHistory.create({
      OrderID: orderId,
      OldStatus: 'PENDING',
      NewStatus: 'CONFIRMED',
      ChangedBy: staffId,
      ChangedByType: 'STAFF',
      Notes: 'Order confirmed by cashier',
      CreatedAt: new Date()
    });

    return res.json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    return res.status(500).json({ error: 'Failed to confirm order' });
  }
};

/**
 * Reject/Cancel an order (before preparation)
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const staffId = req.user.id;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.Status)) {
      return res.status(400).json({
        error: 'Only pending or confirmed orders can be cancelled'
      });
    }

    const previousStatus = order.Status;

    await order.update({
      Status: 'CANCELLED',
      CancellationReason: reason || 'Cancelled by cashier',
      CancelledBy: 'CASHIER',
      CancelledAt: new Date()
    });

    await OrderStatusHistory.create({
      OrderID: orderId,
      OldStatus: previousStatus,
      NewStatus: 'CANCELLED',
      ChangedBy: staffId,
      ChangedByType: 'STAFF',
      Notes: reason || 'Cancelled by cashier',
      CreatedAt: new Date()
    });

    return res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
};

/**
 * Register new customer manually
 */
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Check if phone or email already exists
    const whereClause = { Phone: phone };
    if (email) {
      whereClause.Email = email.toLowerCase();
    }

    const existingCustomer = await Customer.findOne({ where: whereClause });

    if (existingCustomer) {
      return res.status(409).json({ error: 'Customer with this phone/email already exists' });
    }

    // Generate secure random password if not provided
    const finalPassword = password || `${crypto.randomBytes(8).toString('hex')}A1!`;

    // Create customer
    const customer = await Customer.create({
      Name: name,
      Email: email ? email.toLowerCase() : null,
      Phone: phone,
      Password: finalPassword,
      AccountStatus: 'ACTIVE',
      IsEmailVerified: false,
      IsPhoneVerified: false
    });

    // Create address if provided
    if (address) {
      await Address.create({
        CustomerID: customer.CustomerID,
        AddressLine1: address.line1,
        AddressLine2: address.line2 || null,
        City: address.city,
        PostalCode: address.postalCode || null,
        District: address.district || null
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: customer.toJSON()
    });
  } catch (error) {
    console.error('Register customer error:', error);

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

    return res.status(500).json({ error: 'Failed to register customer' });
  }
};

/**
 * Update customer details
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phone, email, address } = req.body;

    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Update customer
    if (name) customer.Name = name;
    if (phone) customer.Phone = phone;
    if (email) customer.Email = email.toLowerCase();

    await customer.save();

    // Update address if provided
    if (address) {
      const existingAddress = await Address.findOne({
        where: { CustomerID: customerId }
      });

      if (existingAddress) {
        await existingAddress.update({
          AddressLine1: address.line1 || existingAddress.AddressLine1,
          AddressLine2: address.line2 || existingAddress.AddressLine2,
          City: address.city || existingAddress.City,
          PostalCode: address.postalCode || existingAddress.PostalCode,
          District: address.district || existingAddress.District
        });
      } else {
        await Address.create({
          CustomerID: customerId,
          AddressLine1: address.line1,
          AddressLine2: address.line2 || null,
          City: address.city,
          PostalCode: address.postalCode || null,
          District: address.district || null
        });
      }
    }

    return res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

    return res.status(500).json({ error: 'Failed to update customer' });
  }
};

/**
 * Get all customers
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 200);

    const where = {};

    if (search) {
      where[sequelize.Sequelize.Op.or] = [
        { Name: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { Email: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { Phone: { [sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const customers = await Customer.findAll({
      where,
      include: [{
        model: Address,
        as: 'addresses'
      }],
      limit: safeLimit,
      order: [[sequelize.literal('`Customer`.`created_at`'), 'DESC']]
    });

    return res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

/**
 * Get customer by ID
 */
exports.getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findByPk(customerId, {
      include: [
        {
          model: Address,
          as: 'addresses'
        },
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [[sequelize.literal('`Order`.`created_at`'), 'DESC']]
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

module.exports = exports;
