const { Order, OrderItem, MenuItem, DailyStock, OrderStatusHistory, Payment, sequelize } = require('../models');
const orderService = require('../services/orderService');

const hasConfiguredStripeSecret = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return typeof secretKey === 'string' && secretKey.trim().startsWith('sk_') && !secretKey.includes('your_');
};

const trySyncCardPaymentStatus = async (payment) => {
  if (!payment || payment.Method !== 'CARD' || payment.Status === 'PAID' || !payment.TransactionID) {
    return false;
  }

  if (!hasConfiguredStripeSecret()) {
    return false;
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(payment.TransactionID);

    if (intent?.status === 'succeeded') {
      await payment.update({
        Status: 'PAID',
        PaidAt: payment.PaidAt || new Date(),
        GatewayStatus: 'SUCCESS'
      });
      return true;
    }
  } catch (error) {
    console.warn(`[KITCHEN] Stripe payment sync failed for transaction ${payment.TransactionID}:`, error.message);
  }

  return false;
};

const requiresSettledPayment = (payment) => {
  return !!payment && ['CARD', 'ONLINE', 'WALLET'].includes(payment.Method);
};

/**
 * Get kitchen dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { Op } = sequelize.Sequelize;

    // Active orders (CONFIRMED, PREPARING)
    const activeOrders = await Order.count({
      include: [{
        model: Payment,
        as: 'payment',
        attributes: [],
        required: false
      }],
      where: {
        [Op.or]: [
          { Status: 'PREPARING' },
          {
            [Op.and]: [
              { Status: 'CONFIRMED' },
              {
                [Op.or]: [
                  { '$payment.Method$': 'CASH' },
                  { '$payment.Status$': 'PAID' }
                ]
              }
            ]
          }
        ]
      }
    });

    // Preparing orders
    const preparingOrders = await Order.count({
      where: { Status: 'PREPARING' }
    });

    // Ready orders
    const readyOrders = await Order.count({
      where: { Status: 'READY' }
    });

    // Today's completed orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await Order.count({
      where: {
        Status: {
          [sequelize.Sequelize.Op.in]: ['READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
        },
        updated_at: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    return res.json({
      success: true,
      stats: {
        activeOrders,
        preparingOrders,
        readyOrders,
        completedToday
      }
    });
  } catch (error) {
    console.error('Kitchen dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get assigned orders for kitchen
 */
exports.getAssignedOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const { Op } = sequelize.Sequelize;

    const where = {
      Status: {
        [Op.in]: ['CONFIRMED', 'PREPARING', 'READY']
      }
    };

    if (status) {
      where.Status = status;
    }

    if (status === 'CONFIRMED') {
      where[Op.or] = [
        { '$payment.Method$': 'CASH' },
        { '$payment.Status$': 'PAID' }
      ];
    }

    if (!status) {
      where[Op.or] = [
        { Status: { [Op.in]: ['PREPARING', 'READY'] } },
        {
          [Op.and]: [
            { Status: 'CONFIRMED' },
            {
              [Op.or]: [
                { '$payment.Method$': 'CASH' },
                { '$payment.Status$': 'PAID' }
              ]
            }
          ]
        }
      ];
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Payment,
          as: 'payment',
          attributes: ['PaymentID', 'Method', 'Status', 'GatewayStatus'],
          required: false
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem',
            attributes: ['MenuItemID', 'Name', 'Description', 'ImageURL']
          }]
        }
      ],
      order: [
        // Prioritize status: CONFIRMED (needs kitchen confirmation) first, then PREPARING, then READY
        sequelize.literal("CASE WHEN `Order`.Status = 'CONFIRMED' THEN 0 WHEN `Order`.Status = 'PREPARING' THEN 1 WHEN `Order`.Status = 'READY' THEN 2 ELSE 3 END"),
        // Then show newest orders first within each status
        ['created_at', 'DESC']
      ]
    });

    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get assigned orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * Update order status (CONFIRMED -> PREPARING -> READY)
 * CRITICAL: Uses orderService to ensure notifications are sent to customer
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const staffId = req.user.id;

    const order = await Order.findByPk(orderId, {
      include: [{ model: Payment, as: 'payment' }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Idempotent guard: if frontend retries the same status update, treat it as success.
    if (order.Status === status) {
      return res.json({
        success: true,
        message: `Order is already in ${status} status`,
        data: order
      });
    }

    // Validate status transitions
    const validTransitions = {
      'CONFIRMED': ['PREPARING'],
      'PREPARING': ['READY'],
      'READY': ['OUT_FOR_DELIVERY']
    };

    if (!validTransitions[order.Status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot change status from ${order.Status} to ${status}`
      });
    }

    // Require settled non-cash payments before kitchen starts preparation.
    if (['PREPARING', 'READY'].includes(status)) {
      if (!order.payment) {
        return res.status(400).json({
          error: 'Cannot start preparation: payment record is missing'
        });
      }

      // For CARD payments, attempt just-in-time sync in case webhook has not yet updated status.
      if (order.payment.Method === 'CARD' && order.payment.Status !== 'PAID') {
        const synced = await trySyncCardPaymentStatus(order.payment);
        if (synced) {
          await order.payment.reload();
        }
      }

      if (requiresSettledPayment(order.payment) && order.payment.Status !== 'PAID') {
        return res.status(400).json({
          error: 'Cannot start preparation: online payment not completed'
        });
      }
    }

    // Use orderService to handle status update with notifications
    // This ensures customer receives email/SMS notifications
    const updatedOrder = await orderService.updateOrderStatus(
      orderId,
      status,
      staffId,
      'Status updated by kitchen staff'
    );

    // Update stock after order is marked READY
    if (status === 'READY') {
      await updateStockForOrder(orderId);
      console.log(`[KITCHEN] 🍽️  Order ${order.OrderNumber} marked as READY`);
      console.log(`[KITCHEN] 📦 Order Type: ${order.OrderType}`);
      if (order.OrderType === 'DELIVERY') {
        console.log(`[KITCHEN] 🚚 Triggering auto-assignment for delivery...`);
      }
    }

    return res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update order status' });
  }
};

/**
 * Helper function to update stock when order is ready
 */
async function updateStockForOrder(orderId) {
  const today = new Date().toISOString().split('T')[0];

  const orderItems = await OrderItem.findAll({
    where: { OrderID: orderId },
    include: [{
      model: MenuItem,
      as: 'menuItem'
    }]
  });

  for (const item of orderItems) {
    if (item.MenuItemID) {
      // Update or create daily stock entry
      const [stock, created] = await DailyStock.findOrCreate({
        where: {
          MenuItemID: item.MenuItemID,
          StockDate: today
        },
        defaults: {
          OpeningQuantity: 0,
          SoldQuantity: item.Quantity,
          AdjustedQuantity: 0
        }
      });

      if (!created) {
        await stock.increment('SoldQuantity', { by: item.Quantity });
      }
    }
  }
}

/**
 * Get daily stock for all menu items
 */
exports.getDailyStock = async (req, res) => {
  try {
    const { date } = req.query;
    const stockDate = date || new Date().toISOString().split('T')[0];

    const stock = await DailyStock.findAll({
      where: { StockDate: stockDate },
      include: [{
        model: MenuItem,
        as: 'menuItem',
        attributes: ['MenuItemID', 'Name', 'Price', 'ImageURL'],
        include: [{
          model: require('../models').Category,
          as: 'category',
          attributes: ['CategoryID', 'Name']
        }]
      }],
      order: [[{ model: MenuItem, as: 'menuItem' }, 'Name', 'ASC']]
    });

    return res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get daily stock error:', error);
    return res.status(500).json({ error: 'Failed to fetch daily stock' });
  }
};

/**
 * Update daily stock quantity
 */
exports.updateDailyStock = async (req, res) => {
  try {
    const { menuItemId, openingQuantity, adjustedQuantity } = req.body;
    const staffId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!menuItemId || openingQuantity === undefined) {
      return res.status(400).json({ error: 'Menu item ID and opening quantity are required' });
    }

    // Find or create stock entry for today
    const [stock, created] = await DailyStock.findOrCreate({
      where: {
        MenuItemID: menuItemId,
        StockDate: today
      },
      defaults: {
        OpeningQuantity: openingQuantity,
        SoldQuantity: 0,
        AdjustedQuantity: adjustedQuantity || 0,
        UpdatedBy: staffId
      }
    });

    if (!created) {
      await stock.update({
        OpeningQuantity: openingQuantity,
        AdjustedQuantity: adjustedQuantity !== undefined ? adjustedQuantity : stock.AdjustedQuantity,
        UpdatedBy: staffId
      });
    }

    return res.json({
      success: true,
      message: 'Stock updated successfully',
      data: stock
    });
  } catch (error) {
    console.error('Update daily stock error:', error);
    return res.status(500).json({ error: 'Failed to update stock' });
  }
};

/**
 * Bulk update daily stock
 */
exports.bulkUpdateDailyStock = async (req, res) => {
  try {
    const { items } = req.body; // Array of { menuItemId, openingQuantity, adjustedQuantity }
    const staffId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const results = [];

    for (const item of items) {
      const [stock, created] = await DailyStock.findOrCreate({
        where: {
          MenuItemID: item.menuItemId,
          StockDate: today
        },
        defaults: {
          OpeningQuantity: item.openingQuantity,
          SoldQuantity: 0,
          AdjustedQuantity: item.adjustedQuantity || 0,
          UpdatedBy: staffId
        }
      });

      if (!created) {
        await stock.update({
          OpeningQuantity: item.openingQuantity,
          AdjustedQuantity: item.adjustedQuantity !== undefined ? item.adjustedQuantity : stock.AdjustedQuantity,
          UpdatedBy: staffId
        });
      }

      results.push(stock);
    }

    return res.json({
      success: true,
      message: 'Stock updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Bulk update daily stock error:', error);
    return res.status(500).json({ error: 'Failed to update stock' });
  }
};

/**
 * Get all menu items for stock management
 */
exports.getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      where: { IsActive: true },
      include: [{
        model: require('../models').Category,
        as: 'category',
        attributes: ['CategoryID', 'Name']
      }],
      order: [['Name', 'ASC']]
    });

    return res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    return res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

module.exports = exports;
