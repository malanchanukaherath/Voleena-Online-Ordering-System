const { Order, Customer, OrderItem, MenuItem, Delivery, Address, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Get cashier dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pending orders
    const pendingOrders = await Order.count({
      where: { Status: 'PENDING' }
    });

    // Today's orders
    const todayOrders = await Order.count({
      where: {
        CreatedAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    // Today's revenue
    const todayRevenue = await Order.sum('FinalAmount', {
      where: {
        CreatedAt: {
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
        CreatedAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    return res.json({
      success: true,
      stats: {
        pendingOrders,
        todayOrders,
        todayRevenue: todayRevenue || 0,
        newCustomers
      }
    });
  } catch (error) {
    console.error('Cashier dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get all orders with customer details
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;

    const where = {};

    if (status) {
      where.Status = status;
    }

    if (startDate && endDate) {
      where.CreatedAt = {
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
          as: 'orderItems',
          include: [{
            model: MenuItem,
            as: 'menuItem',
            attributes: ['MenuItemID', 'Name', 'Price']
          }]
        }
      ],
      order: [['CreatedAt', 'DESC']],
      limit: parseInt(limit)
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
 */
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const staffId = req.user.id;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.Status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending orders can be confirmed' });
    }

    await order.update({
      Status: 'CONFIRMED',
      ConfirmedAt: new Date(),
      ConfirmedBy: staffId
    });

    // Log status change
    await sequelize.query(
      `INSERT INTO order_status_history (OrderID, OldStatus, NewStatus, ChangedBy, ChangedByType, Notes)
       VALUES (?, 'PENDING', 'CONFIRMED', ?, 'STAFF', 'Order confirmed by cashier')`,
      {
        replacements: [orderId, staffId],
        type: sequelize.QueryTypes.INSERT
      }
    );

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

    await order.update({
      Status: 'CANCELLED',
      CancellationReason: reason || 'Cancelled by cashier',
      CancelledBy: 'CASHIER',
      CancelledAt: new Date()
    });

    // Log status change
    await sequelize.query(
      `INSERT INTO order_status_history (OrderID, OldStatus, NewStatus, ChangedBy, ChangedByType, Notes)
       VALUES (?, ?, 'CANCELLED', ?, 'STAFF', ?)`,
      {
        replacements: [orderId, order.Status, staffId, reason || 'Cancelled by cashier'],
        type: sequelize.QueryTypes.INSERT
      }
    );

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

    // Create customer
    const customer = await Customer.create({
      Name: name,
      Email: email ? email.toLowerCase() : null,
      Phone: phone,
      Password: password || 'default123', // Default password if not provided
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
    return res.status(500).json({ error: 'Failed to update customer' });
  }
};

/**
 * Get all customers
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

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
      limit: parseInt(limit),
      order: [['CreatedAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);
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
          order: [['CreatedAt', 'DESC']]
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
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

module.exports = exports;
