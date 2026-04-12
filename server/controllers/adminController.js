const {
  Staff,
  Customer,
  Order,
  MenuItem,
  Category,
  ComboPack,
  Promotion,
  DailyStock,
  Role,
  Delivery,
  DeliveryStaffAvailability,
  Feedback,
  sequelize
} = require('../models');
const bcrypt = require('bcryptjs');
const { calculateEstimatedDeliveryTime } = require('../utils/deliveryEta');
const systemSettingsService = require('../services/systemSettingsService');
const appNotificationService = require('../services/appNotificationService');

const parseAnalyticsDateRange = (query) => {
  const hasCustomRange = Boolean(query.startDate || query.endDate);

  if (hasCustomRange) {
    if (!query.startDate || !query.endDate) {
      return { error: 'Both startDate and endDate are required for custom range' };
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { error: 'Invalid startDate or endDate format' };
    }

    if (endDate < startDate) {
      return { error: 'endDate must be greater than or equal to startDate' };
    }

    return { startDate, endDate };
  }

  const year = parseInt(query.year, 10);
  const month = parseInt(query.month, 10);

  if (!year || !month || Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return { error: 'Valid year and month (1-12) are required when custom range is not provided' };
  }

  return {
    startDate: new Date(year, month - 1, 1, 0, 0, 0, 0),
    endDate: new Date(year, month, 0, 23, 59, 59, 999)
  };
};

const decodeFeedbackPayload = (rawComment) => {
  if (!rawComment || typeof rawComment !== 'string') {
    return {
      comment: '',
      positiveTags: [],
      issueTags: []
    };
  }

  try {
    const parsed = JSON.parse(rawComment);
    return {
      comment: String(parsed?.comment || ''),
      positiveTags: Array.isArray(parsed?.positiveTags) ? parsed.positiveTags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
      issueTags: Array.isArray(parsed?.issueTags) ? parsed.issueTags.map((tag) => String(tag || '').trim()).filter(Boolean) : []
    };
  } catch {
    return {
      comment: rawComment,
      positiveTags: [],
      issueTags: []
    };
  }
};

const incrementCounter = (map, key) => {
  if (!key) {
    return;
  }

  map.set(key, (map.get(key) || 0) + 1);
};

const safeNumber = (value, digits = 2) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Number(parsed.toFixed(digits));
};

const getRangeLabel = (startDate, endDate) => {
  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) {
    return startDate.toLocaleDateString();
  }

  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total orders
    const totalOrders = await Order.count();

    // Today's orders
    const todayOrders = await Order.count({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    // Total revenue
    const revenueResult = await Order.sum('final_amount', {
      where: {
        Status: {
          [sequelize.Sequelize.Op.not]: 'CANCELLED'
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

    // Active customers
    const activeCustomers = await Customer.count({
      where: { AccountStatus: 'ACTIVE' }
    });

    // Total staff
    const totalStaff = await Staff.count({
      where: { IsActive: true }
    });

    // Pending orders (should be minimal now with auto-confirmation)
    const pendingOrders = await Order.count({
      where: { Status: 'PENDING' }
    });

    // Active orders (confirmed/preparing)
    const activeOrders = await Order.count({
      where: {
        Status: {
          [sequelize.Sequelize.Op.in]: ['CONFIRMED', 'PREPARING']
        }
      }
    });

    // Active deliveries
    const activeDeliveries = await Delivery.count({
      where: {
        Status: {
          [sequelize.Sequelize.Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        }
      }
    });

    return res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: revenueResult || 0,
        todayRevenue: todayRevenue || 0,
        activeCustomers,
        totalStaff,
        pendingOrders,
        activeOrders,
        activeDeliveries
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get monthly sales report
 */
exports.getMonthlySalesReport = async (req, res) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    if (range.error) {
      return res.status(400).json({ error: range.error });
    }
    const { startDate, endDate } = range;

    const salesData = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(final_amount), 0) as revenue
      FROM \`order\`
      WHERE created_at BETWEEN ? AND ?
        AND status != 'CANCELLED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, {
      replacements: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Monthly sales report error:', error);
    return res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};

/**
 * Get best-selling items with proper parameterized queries
 */
exports.getBestSellingItems = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 100); // Safety limit

    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({ error: 'Both startDate and endDate are required when filtering by range' });
    }

    let normalizedStartDate = null;
    let normalizedEndDate = null;
    if (startDate && endDate) {
      normalizedStartDate = new Date(startDate);
      normalizedEndDate = new Date(endDate);

      if (Number.isNaN(normalizedStartDate.getTime()) || Number.isNaN(normalizedEndDate.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate or endDate format' });
      }

      if (normalizedEndDate < normalizedStartDate) {
        return res.status(400).json({ error: 'endDate must be greater than or equal to startDate' });
      }
    }

    let query = `
      SELECT 
        m.menu_item_id AS MenuItemID,
        m.name AS Name,
        COALESCE(c.name, 'Uncategorized') AS CategoryName,
        COUNT(oi.order_item_id) as totalSold,
        COALESCE(SUM(oi.quantity), 0) as totalQuantity,
        COALESCE(SUM(oi.subtotal), 0) as totalRevenue
      FROM \`order_item\` oi
      INNER JOIN \`order\` o ON oi.order_id = o.order_id
      INNER JOIN \`menu_item\` m ON m.menu_item_id = oi.menu_item_id
      LEFT JOIN \`category\` c ON m.category_id = c.category_id
      WHERE o.status != 'CANCELLED'
    `;

    const replacements = [];

    if (normalizedStartDate && normalizedEndDate) {
      query += ' AND o.created_at BETWEEN ? AND ? ';
      replacements.push(normalizedStartDate, normalizedEndDate);
    }

    query += `
      GROUP BY m.menu_item_id, m.name, c.name
      ORDER BY totalQuantity DESC
      LIMIT ?
    `;
    replacements.push(limitNum);

    const salesData = await sequelize.query(query, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Best selling items error:', error);
    return res.status(500).json({ error: 'Failed to fetch best-selling items' });
  }
};

/**
 * Get customer retention report for selected date range
 */
exports.getCustomerRetentionReport = async (req, res) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    if (range.error) {
      return res.status(400).json({ error: range.error });
    }

    const { startDate, endDate } = range;

    const [result] = await sequelize.query(`
      SELECT
        COUNT(*) AS totalCustomers,
        SUM(CASE WHEN customerOrders.orderCount >= 2 THEN 1 ELSE 0 END) AS retainedCustomers
      FROM (
        SELECT
          o.customer_id AS customerId,
          COUNT(*) AS orderCount
        FROM \`order\` o
        WHERE o.customer_id IS NOT NULL
          AND o.status = 'DELIVERED'
          AND o.created_at BETWEEN ? AND ?
        GROUP BY o.customer_id
      ) AS customerOrders
    `, {
      replacements: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });

    const totalCustomers = Number(result?.totalCustomers || 0);
    const retainedCustomers = Number(result?.retainedCustomers || 0);
    const retentionRate = totalCustomers > 0
      ? Number(((retainedCustomers / totalCustomers) * 100).toFixed(2))
      : 0;

    return res.json({
      success: true,
      data: {
        totalCustomers,
        retainedCustomers,
        retentionRate,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Customer retention report error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer retention report' });
  }
};

/**
 * Get consolidated business report for admin analytics, printing, and exports
 */
exports.getBusinessSummaryReport = async (req, res) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    if (range.error) {
      return res.status(400).json({ error: range.error });
    }

    const { startDate, endDate } = range;
    const replacements = [startDate, endDate];

    const [
      [summaryResult],
      revenueTrend,
      orderTypeBreakdown,
      orderStatusBreakdown,
      paymentBreakdown,
      topItems,
      categoryBreakdown,
      [retentionResult],
      [deliveryResult],
      stockMovementBreakdown,
      [feedbackAggregate],
      feedbackRecords,
      [newCustomersResult],
      [uniqueCustomersResult]
    ] = await Promise.all([
      sequelize.query(`
        SELECT
          COUNT(*) AS totalOrders,
          COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN final_amount ELSE 0 END), 0) AS totalRevenue,
          COALESCE(AVG(CASE WHEN status != 'CANCELLED' THEN final_amount END), 0) AS avgOrderValue,
          SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS deliveredOrders,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledOrders,
          SUM(CASE WHEN order_type = 'WALK_IN' THEN 1 ELSE 0 END) AS walkInOrders,
          SUM(CASE WHEN order_type = 'ONLINE' THEN 1 ELSE 0 END) AS onlineOrders,
          SUM(CASE WHEN order_type = 'DELIVERY' THEN 1 ELSE 0 END) AS deliveryOrders,
          SUM(CASE WHEN order_type = 'TAKEAWAY' THEN 1 ELSE 0 END) AS takeawayOrders
        FROM \`order\`
        WHERE created_at BETWEEN ? AND ?
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS orderCount,
          COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN final_amount ELSE 0 END), 0) AS revenue
        FROM \`order\`
        WHERE created_at BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          order_type AS orderType,
          COUNT(*) AS orderCount,
          COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN final_amount ELSE 0 END), 0) AS revenue
        FROM \`order\`
        WHERE created_at BETWEEN ? AND ?
        GROUP BY order_type
        ORDER BY orderCount DESC, revenue DESC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          status,
          COUNT(*) AS orderCount
        FROM \`order\`
        WHERE created_at BETWEEN ? AND ?
        GROUP BY status
        ORDER BY orderCount DESC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          p.method AS method,
          p.status AS status,
          COUNT(*) AS transactionCount,
          COALESCE(SUM(p.amount), 0) AS totalAmount
        FROM payment p
        INNER JOIN \`order\` o ON o.order_id = p.order_id
        WHERE o.created_at BETWEEN ? AND ?
        GROUP BY p.method, p.status
        ORDER BY totalAmount DESC, transactionCount DESC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT *
        FROM (
          SELECT
            'MENU_ITEM' AS itemKind,
            m.name AS itemName,
            COALESCE(c.name, 'Uncategorized') AS categoryName,
            COALESCE(SUM(oi.quantity), 0) AS totalQuantity,
            COALESCE(SUM(oi.subtotal), 0) AS totalRevenue
          FROM order_item oi
          INNER JOIN \`order\` o ON o.order_id = oi.order_id
          INNER JOIN menu_item m ON m.menu_item_id = oi.menu_item_id
          LEFT JOIN category c ON c.category_id = m.category_id
          WHERE o.created_at BETWEEN ? AND ?
            AND o.status != 'CANCELLED'
            AND oi.menu_item_id IS NOT NULL
          GROUP BY m.menu_item_id, m.name, c.name

          UNION ALL

          SELECT
            'COMBO_PACK' AS itemKind,
            cp.name AS itemName,
            'Combo Packs' AS categoryName,
            COALESCE(SUM(oi.quantity), 0) AS totalQuantity,
            COALESCE(SUM(oi.subtotal), 0) AS totalRevenue
          FROM order_item oi
          INNER JOIN \`order\` o ON o.order_id = oi.order_id
          INNER JOIN combo_pack cp ON cp.combo_id = oi.combo_id
          WHERE o.created_at BETWEEN ? AND ?
            AND o.status != 'CANCELLED'
            AND oi.combo_id IS NOT NULL
          GROUP BY cp.combo_id, cp.name
        ) AS rankedItems
        ORDER BY totalQuantity DESC, totalRevenue DESC
        LIMIT 10
      `, {
        replacements: [startDate, endDate, startDate, endDate],
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT *
        FROM (
          SELECT
            COALESCE(c.name, 'Uncategorized') AS categoryName,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COALESCE(SUM(oi.quantity), 0) AS totalQuantity
          FROM order_item oi
          INNER JOIN \`order\` o ON o.order_id = oi.order_id
          INNER JOIN menu_item m ON m.menu_item_id = oi.menu_item_id
          LEFT JOIN category c ON c.category_id = m.category_id
          WHERE o.created_at BETWEEN ? AND ?
            AND o.status != 'CANCELLED'
            AND oi.menu_item_id IS NOT NULL
          GROUP BY c.name

          UNION ALL

          SELECT
            'Combo Packs' AS categoryName,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COALESCE(SUM(oi.quantity), 0) AS totalQuantity
          FROM order_item oi
          INNER JOIN \`order\` o ON o.order_id = oi.order_id
          WHERE o.created_at BETWEEN ? AND ?
            AND o.status != 'CANCELLED'
            AND oi.combo_id IS NOT NULL
        ) AS categoryTotals
        WHERE revenue > 0 OR totalQuantity > 0
        ORDER BY revenue DESC, totalQuantity DESC
      `, {
        replacements: [startDate, endDate, startDate, endDate],
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          COUNT(*) AS totalCustomers,
          SUM(CASE WHEN customerOrders.orderCount >= 2 THEN 1 ELSE 0 END) AS retainedCustomers
        FROM (
          SELECT
            o.customer_id AS customerId,
            COUNT(*) AS orderCount
          FROM \`order\` o
          WHERE o.customer_id IS NOT NULL
            AND o.status = 'DELIVERED'
            AND o.created_at BETWEEN ? AND ?
          GROUP BY o.customer_id
        ) AS customerOrders
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          COUNT(*) AS totalDeliveries,
          SUM(CASE WHEN d.status = 'ASSIGNED' THEN 1 ELSE 0 END) AS assignedCount,
          SUM(CASE WHEN d.status IN ('PICKED_UP', 'IN_TRANSIT') THEN 1 ELSE 0 END) AS activeCount,
          SUM(CASE WHEN d.status = 'DELIVERED' THEN 1 ELSE 0 END) AS deliveredCount,
          SUM(CASE WHEN d.status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount,
          AVG(CASE WHEN d.assigned_at IS NOT NULL AND d.delivered_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, d.assigned_at, d.delivered_at) END) AS avgDeliveryMinutes,
          SUM(CASE WHEN d.delivered_at IS NOT NULL AND d.estimated_delivery_time IS NOT NULL AND d.delivered_at <= d.estimated_delivery_time THEN 1 ELSE 0 END) AS onTimeDeliveries
        FROM delivery d
        INNER JOIN \`order\` o ON o.order_id = d.order_id
        WHERE o.created_at BETWEEN ? AND ?
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          change_type AS changeType,
          COUNT(*) AS movementCount,
          COALESCE(SUM(quantity_change), 0) AS quantityChange
        FROM stock_movement
        WHERE created_at BETWEEN ? AND ?
        GROUP BY change_type
        ORDER BY movementCount DESC, quantityChange DESC
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(`
        SELECT
          COUNT(*) AS totalFeedback,
          COALESCE(AVG(rating), 0) AS averageRating,
          SUM(CASE WHEN admin_response IS NOT NULL AND TRIM(admin_response) != '' THEN 1 ELSE 0 END) AS respondedCount
        FROM feedback
        WHERE created_at BETWEEN ? AND ?
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      Feedback.findAll({
        where: {
          created_at: {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
          }
        },
        attributes: ['FeedbackID', 'Rating', 'Comment', 'AdminResponse', 'created_at'],
        raw: true
      }),
      Customer.count({
        where: {
          created_at: {
            [sequelize.Sequelize.Op.between]: [startDate, endDate]
          }
        }
      }).then((count) => [{ newCustomers: count }]),
      sequelize.query(`
        SELECT
          COUNT(DISTINCT customer_id) AS uniqueCustomers
        FROM \`order\`
        WHERE created_at BETWEEN ? AND ?
          AND customer_id IS NOT NULL
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      })
    ]);

    const totalOrders = Number(summaryResult?.totalOrders || 0);
    const totalRevenue = safeNumber(summaryResult?.totalRevenue || 0);
    const deliveredOrders = Number(summaryResult?.deliveredOrders || 0);
    const cancelledOrders = Number(summaryResult?.cancelledOrders || 0);
    const respondedCount = Number(feedbackAggregate?.respondedCount || 0);
    const totalFeedback = Number(feedbackAggregate?.totalFeedback || 0);
    const pendingFeedbackReplies = Math.max(totalFeedback - respondedCount, 0);

    const positiveTagCounts = new Map();
    const issueTagCounts = new Map();

    feedbackRecords.forEach((record) => {
      const decoded = decodeFeedbackPayload(record.Comment);
      decoded.positiveTags.forEach((tag) => incrementCounter(positiveTagCounts, tag));
      decoded.issueTags.forEach((tag) => incrementCounter(issueTagCounts, tag));
    });

    const retainedCustomers = Number(retentionResult?.retainedCustomers || 0);
    const retentionTotalCustomers = Number(retentionResult?.totalCustomers || 0);
    const deliveredCount = Number(deliveryResult?.deliveredCount || 0);
    const onTimeDeliveries = Number(deliveryResult?.onTimeDeliveries || 0);

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        range: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          label: getRangeLabel(startDate, endDate)
        },
        summary: {
          totalOrders,
          totalRevenue,
          avgOrderValue: safeNumber(summaryResult?.avgOrderValue || 0),
          deliveredOrders,
          cancelledOrders,
          walkInOrders: Number(summaryResult?.walkInOrders || 0),
          onlineOrders: Number(summaryResult?.onlineOrders || 0),
          deliveryOrders: Number(summaryResult?.deliveryOrders || 0),
          takeawayOrders: Number(summaryResult?.takeawayOrders || 0),
          uniqueCustomers: Number(uniqueCustomersResult?.uniqueCustomers || 0),
          newCustomers: Number(newCustomersResult?.newCustomers || 0),
          cancellationRate: totalOrders > 0
            ? safeNumber((cancelledOrders / totalOrders) * 100)
            : 0
        },
        revenueTrend: revenueTrend.map((row) => ({
          date: row.date,
          revenue: safeNumber(row.revenue || 0),
          orders: Number(row.orderCount || 0)
        })),
        orderTypeBreakdown: orderTypeBreakdown.map((row) => ({
          orderType: row.orderType,
          orderCount: Number(row.orderCount || 0),
          revenue: safeNumber(row.revenue || 0)
        })),
        orderStatusBreakdown: orderStatusBreakdown.map((row) => ({
          status: row.status,
          orderCount: Number(row.orderCount || 0)
        })),
        paymentBreakdown: paymentBreakdown.map((row) => ({
          method: row.method,
          status: row.status,
          transactionCount: Number(row.transactionCount || 0),
          totalAmount: safeNumber(row.totalAmount || 0)
        })),
        topItems: topItems.map((row) => ({
          itemKind: row.itemKind,
          itemName: row.itemName,
          categoryName: row.categoryName,
          totalQuantity: Number(row.totalQuantity || 0),
          totalRevenue: safeNumber(row.totalRevenue || 0)
        })),
        categoryBreakdown: categoryBreakdown.map((row) => ({
          categoryName: row.categoryName,
          totalQuantity: Number(row.totalQuantity || 0),
          revenue: safeNumber(row.revenue || 0)
        })),
        customerRetention: {
          totalCustomers: retentionTotalCustomers,
          retainedCustomers,
          retentionRate: retentionTotalCustomers > 0
            ? safeNumber((retainedCustomers / retentionTotalCustomers) * 100)
            : 0
        },
        deliveryPerformance: {
          totalDeliveries: Number(deliveryResult?.totalDeliveries || 0),
          assignedCount: Number(deliveryResult?.assignedCount || 0),
          activeCount: Number(deliveryResult?.activeCount || 0),
          deliveredCount,
          failedCount: Number(deliveryResult?.failedCount || 0),
          avgDeliveryMinutes: safeNumber(deliveryResult?.avgDeliveryMinutes || 0),
          onTimeDeliveries,
          onTimeRate: deliveredCount > 0
            ? safeNumber((onTimeDeliveries / deliveredCount) * 100)
            : 0
        },
        stockMovementBreakdown: stockMovementBreakdown.map((row) => ({
          changeType: row.changeType,
          movementCount: Number(row.movementCount || 0),
          quantityChange: Number(row.quantityChange || 0)
        })),
        feedbackSummary: {
          totalFeedback,
          averageRating: safeNumber(feedbackAggregate?.averageRating || 0),
          respondedCount,
          pendingReplies: pendingFeedbackReplies,
          positiveTagBreakdown: [...positiveTagCounts.entries()]
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count),
          issueTagBreakdown: [...issueTagCounts.entries()]
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
        }
      }
    });
  } catch (error) {
    console.error('Business summary report error:', error);
    return res.status(500).json({ error: 'Failed to fetch business summary report' });
  }
};

/**
 * Create staff account with role restrictions
 */
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, roleId, password } = req.body;
    const adminRoleId = req.user.roleId; // Get requesting user's role

    // Validation
    if (!name || !email || !phone || !roleId || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // CRITICAL: Only Owner/Super Admin can create Admin accounts
    const roleRow = await Role.findByPk(roleId);
    if (!roleRow) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent creating roles higher than self
    if (roleRow.RoleName === 'Admin') {
      const adminRole = await Role.findOne({ where: { RoleName: 'Admin' } });
      const myRole = await Role.findByPk(adminRoleId);

      // Only allow if requesting user is also Admin (for now, can enhance with role hierarchy)
      if (!myRole || myRole.RoleName !== 'Admin') {
        return res.status(403).json({ error: 'Only Admin can create other Admins' });
      }
    }

    // Check if email exists in BOTH Staff and Customer
    const [existingStaff, existingCustomer] = await Promise.all([
      Staff.findOne({ where: { Email: email.toLowerCase() } }),
      Customer.findOne({ where: { Email: email.toLowerCase() } })
    ]);

    if (existingStaff || existingCustomer) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Create staff
    const staff = await Staff.create({
      Name: name,
      Email: email.toLowerCase(),
      Phone: phone,
      RoleID: roleId,
      Password: password,
      IsActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff.toJSON()
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({ error: 'Failed to create staff' });
  }
};

/**
 * Update staff account - CRITICAL: Prevent self-promotion to Admin
 */
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, roleId, isActive } = req.body;
    const requestingUserId = req.user.id;

    const staff = await Staff.findByPk(id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // CRITICAL: Prevent staff from changing their own role
    if (parseInt(id) === requestingUserId && roleId && roleId !== staff.RoleID) {
      return res.status(403).json({ error: 'You cannot change your own role. Contact your administrator.' });
    }

    // CRITICAL: Prevent staff from promoting themselves to Admin
    if (parseInt(id) === requestingUserId && roleId) {
      const newRole = await Role.findByPk(roleId);
      if (newRole && newRole.RoleName === 'Admin') {
        return res.status(403).json({ error: 'Privilege escalation prevented. Admin role cannot be self-assigned.' });
      }
    }

    // Check if email is being changed and validate uniqueness in BOTH tables
    if (email && email.toLowerCase() !== staff.Email) {
      const [existingStaff, existingCustomer] = await Promise.all([
        Staff.findOne({ where: { Email: email.toLowerCase() } }),
        Customer.findOne({ where: { Email: email.toLowerCase() } })
      ]);
      if (existingStaff || existingCustomer) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    await staff.update({
      Name: name || staff.Name,
      Email: email ? email.toLowerCase() : staff.Email,
      Phone: phone || staff.Phone,
      RoleID: roleId || staff.RoleID,
      IsActive: isActive !== undefined ? isActive : staff.IsActive
    });

    return res.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff.toJSON()
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return res.status(500).json({ error: 'Failed to update staff' });
  }
};

/**
 * Delete staff account
 */
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByPk(id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Soft delete by setting IsActive to false
    await staff.update({ IsActive: false });

    return res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({ error: 'Failed to delete staff' });
  }
};

/**
 * Get all staff
 */
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({
      include: [{
        model: Role,
        as: 'role',
        attributes: ['RoleID', 'RoleName', 'Description']
      }],
      order: [[sequelize.literal('`Staff`.`created_at`'), 'DESC']]
    });

    return res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get all staff error:', error);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

/**
 * Get all roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['RoleID', 'RoleName', 'Description']
    });

    return res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

/**
 * Assign delivery staff to order
 */
exports.assignDeliveryStaff = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
  });

  try {
    const { orderId, staffId } = req.body;
    const normalizedOrderId = Number(orderId);
    const normalizedStaffId = Number(staffId);

    if (!normalizedOrderId || !normalizedStaffId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Order ID and Staff ID are required' });
    }

    const order = await Order.findByPk(normalizedOrderId, { transaction, lock: transaction.LOCK.UPDATE });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order exists and lock the row to avoid concurrent re-assignment.
    const delivery = await Delivery.findOne({
      where: { OrderID: normalizedOrderId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!delivery) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Delivery not found for this order' });
    }

    if (delivery.Status === 'DELIVERED') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cannot assign staff to a delivered order' });
    }

    // Idempotent success when the same rider is already assigned for this order.
    if (delivery.DeliveryStaffID === normalizedStaffId && delivery.Status === 'ASSIGNED') {
      await transaction.commit();
      return res.json({
        success: true,
        message: 'Delivery staff already assigned to this order'
      });
    }

    // Verify staff is delivery role
    const staff = await Staff.findOne({
      where: { StaffID: normalizedStaffId, IsActive: true },
      include: [{
        model: Role,
        as: 'role',
        where: { RoleName: 'Delivery' }
      }],
      transaction
    });

    if (!staff) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid delivery staff' });
    }

    const [availability] = await DeliveryStaffAvailability.findOrCreate({
      where: { DeliveryStaffID: normalizedStaffId },
      defaults: {
        DeliveryStaffID: normalizedStaffId,
        IsAvailable: true,
        CurrentOrderID: null
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    const alreadyReservedForThisOrder =
      availability.CurrentOrderID === normalizedOrderId && availability.IsAvailable === false;

    // Manual assignment must not bypass rider opt-out (is_available = false).
    if (!availability.IsAvailable && !alreadyReservedForThisOrder) {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Selected delivery staff is currently unavailable'
      });
    }

    if (!alreadyReservedForThisOrder) {
      const [reservedCount] = await DeliveryStaffAvailability.update(
        {
          IsAvailable: false,
          CurrentOrderID: normalizedOrderId
        },
        {
          where: {
            DeliveryStaffID: normalizedStaffId,
            IsAvailable: true
          },
          transaction
        }
      );

      if (reservedCount === 0) {
        await transaction.rollback();
        return res.status(409).json({
          error: 'Selected delivery staff became unavailable during assignment'
        });
      }
    }

    // If reassigning from another staff member, release the previous assignee.
    if (delivery.DeliveryStaffID && delivery.DeliveryStaffID !== normalizedStaffId) {
      await DeliveryStaffAvailability.update(
        {
          IsAvailable: true,
          CurrentOrderID: null
        },
        {
          where: {
            DeliveryStaffID: delivery.DeliveryStaffID,
            CurrentOrderID: normalizedOrderId
          },
          transaction
        }
      );
    }

    // Update delivery
    await delivery.update({
      DeliveryStaffID: normalizedStaffId,
      Status: 'ASSIGNED',
      AssignedAt: new Date(),
      EstimatedDeliveryTime: calculateEstimatedDeliveryTime({
        stage: 'ASSIGNED',
        distanceKm: Number(delivery.DistanceKm) || 0,
        baseTime: new Date()
      })
    }, {
      transaction
    });

    // Update order status
    await Order.update(
      { Status: 'OUT_FOR_DELIVERY' },
      {
        where: { OrderID: normalizedOrderId },
        transaction
      }
    );

    await transaction.commit();

    try {
      await appNotificationService.notifyStaffById(normalizedStaffId, {
        eventType: 'DELIVERY_ASSIGNED',
        title: 'New Delivery Assignment',
        message: `Order #${order.OrderNumber || normalizedOrderId} has been assigned to you.`,
        priority: 'HIGH',
        relatedOrderId: normalizedOrderId,
        payload: {
          orderId: normalizedOrderId,
          orderNumber: order.OrderNumber || null,
          assignedBy: req.user?.id || null
        },
        dedupeKey: `DELIVERY_ASSIGNED:STAFF:${normalizedStaffId}:${normalizedOrderId}`
      });

      if (order.CustomerID) {
        await appNotificationService.notifyCustomer(order.CustomerID, {
          eventType: 'ORDER_OUT_FOR_DELIVERY',
          title: `Order #${order.OrderNumber || normalizedOrderId}`,
          message: 'Your order is now out for delivery.',
          priority: 'HIGH',
          relatedOrderId: normalizedOrderId,
          payload: {
            orderId: normalizedOrderId,
            orderNumber: order.OrderNumber || null
          },
          dedupeKey: `ORDER_OUT_FOR_DELIVERY:CUSTOMER:${order.CustomerID}:${normalizedOrderId}`
        });
      }

      await appNotificationService.notifyStaffRoles(['Admin'], {
        eventType: 'DELIVERY_ASSIGNED',
        title: `Order #${order.OrderNumber || normalizedOrderId}`,
        message: `${staff.Name} assigned for delivery.`,
        priority: 'MEDIUM',
        relatedOrderId: normalizedOrderId,
        payload: {
          orderId: normalizedOrderId,
          orderNumber: order.OrderNumber || null,
          staffId: normalizedStaffId,
          staffName: staff.Name
        },
        dedupeKey: `DELIVERY_ASSIGNED:STAFF_BROADCAST:${normalizedOrderId}:${normalizedStaffId}`
      });
    } catch (notificationError) {
      console.error('[APP_NOTIFICATION] assignDeliveryStaff:', notificationError.message);
    }

    return res.json({
      success: true,
      message: 'Delivery staff assigned successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Assign delivery staff error:', error);
    return res.status(500).json({ error: 'Failed to assign delivery staff' });
  }
};

/**
 * Get admin system settings
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await systemSettingsService.getAdminSettings();

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to fetch settings'
    });
  }
};

/**
 * Update admin system settings
 */
exports.updateSystemSettings = async (req, res) => {
  try {
    const updatedSettings = await systemSettingsService.updateAdminSettings(req.body, req.user?.id || null);

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update settings'
    });
  }
};

module.exports = exports;
