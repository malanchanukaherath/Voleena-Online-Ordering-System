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
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);

    if (!year || !month || isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Valid year and month (1-12) are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

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

    let query = `
      SELECT 
        m.menu_item_id AS MenuItemID,
        m.name AS Name,
        COALESCE(c.name, 'Uncategorized') AS CategoryName,
        COUNT(oi.order_item_id) as totalSold,
        COALESCE(SUM(oi.quantity), 0) as totalQuantity,
        COALESCE(SUM(oi.subtotal), 0) as totalRevenue
      FROM \`menu_item\` m
      LEFT JOIN \`category\` c ON m.category_id = c.category_id
      LEFT JOIN \`order_item\` oi ON m.menu_item_id = oi.menu_item_id
      LEFT JOIN \`order\` o ON oi.order_id = o.order_id
    `;

    const replacements = [];

    if (startDate && endDate) {
      query += 'WHERE o.created_at BETWEEN ? AND ? ';
      replacements.push(startDate, endDate);
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
      AssignedAt: new Date()
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

module.exports = exports;
