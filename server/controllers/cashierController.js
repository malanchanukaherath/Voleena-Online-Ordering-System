const { Order, Customer, OrderItem, MenuItem, Delivery, Address, OrderStatusHistory, Payment, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const orderService = require('../services/orderService');

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
    const { items, payment_method: paymentMethod, special_instructions: specialInstructions } = req.body;

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

    const guestCustomer = await findOrCreateGuestCustomer();

    const order = await orderService.createOrder(guestCustomer.CustomerID, {
      orderType: 'WALK_IN',
      specialInstructions: specialInstructions || null,
      items: normalizedItems
    });

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
          }]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Walk-in order created and sent to kitchen',
      data: completeOrder
    });
  } catch (error) {
    console.error('Create walk-in order error:', error);
    const errorMessage = error.message || 'Failed to create walk-in order';
    const statusCode = /required|invalid|available|stock|outside|at least one item/i.test(errorMessage)
      ? 400
      : 500;

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
          }]
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
