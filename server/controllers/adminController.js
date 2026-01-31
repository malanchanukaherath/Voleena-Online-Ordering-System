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
        CreatedAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    // Total revenue
    const revenueResult = await Order.sum('FinalAmount', {
      where: {
        Status: {
          [sequelize.Sequelize.Op.not]: 'CANCELLED'
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

    // Active customers
    const activeCustomers = await Customer.count({
      where: { AccountStatus: 'ACTIVE' }
    });

    // Total staff
    const totalStaff = await Staff.count({
      where: { IsActive: true }
    });

    // Pending orders
    const pendingOrders = await Order.count({
      where: { Status: 'PENDING' }
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
    const { year, month } = req.query;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [salesData] = await sequelize.query(`
      SELECT 
        DATE(CreatedAt) as date,
        COUNT(*) as orderCount,
        SUM(FinalAmount) as revenue
      FROM \`order\`
      WHERE CreatedAt BETWEEN ? AND ?
        AND Status != 'CANCELLED'
      GROUP BY DATE(CreatedAt)
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
 * Get best-selling items
 */
exports.getBestSellingItems = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let whereClause = '';
    const replacements = [parseInt(limit)];

    if (startDate && endDate) {
      whereClause = 'WHERE o.CreatedAt BETWEEN ? AND ?';
      replacements.unshift(startDate, endDate);
    }

    const [items] = await sequelize.query(`
      SELECT 
        mi.MenuItemID,
        mi.Name,
        mi.Price,
        mi.ImageURL,
        c.Name as CategoryName,
        SUM(oi.Quantity) as totalSold,
        SUM(oi.Subtotal) as totalRevenue
      FROM order_item oi
      JOIN menu_item mi ON oi.MenuItemID = mi.MenuItemID
      JOIN category c ON mi.CategoryID = c.CategoryID
      JOIN \`order\` o ON oi.OrderID = o.OrderID
      ${whereClause}
      GROUP BY mi.MenuItemID
      ORDER BY totalSold DESC
      LIMIT ?
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Best selling items error:', error);
    return res.status(500).json({ error: 'Failed to fetch best-selling items' });
  }
};

/**
 * Create staff account
 */
exports.createStaff = async (req, res) => {
  try {
    const { name, email, phone, roleId, password } = req.body;

    // Validation
    if (!name || !email || !phone || !roleId || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email exists
    const existingStaff = await Staff.findOne({ where: { Email: email.toLowerCase() } });
    const existingCustomer = await Customer.findOne({ where: { Email: email.toLowerCase() } });

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
 * Update staff account
 */
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, roleId, isActive } = req.body;

    const staff = await Staff.findByPk(id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Check if email is being changed and if it exists
    if (email && email.toLowerCase() !== staff.Email) {
      const existingStaff = await Staff.findOne({ 
        where: { Email: email.toLowerCase() } 
      });
      if (existingStaff) {
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
      order: [['CreatedAt', 'DESC']]
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
  try {
    const { orderId, staffId } = req.body;

    if (!orderId || !staffId) {
      return res.status(400).json({ error: 'Order ID and Staff ID are required' });
    }

    // Check if order exists and has delivery
    const delivery = await Delivery.findOne({ where: { OrderID: orderId } });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found for this order' });
    }

    // Verify staff is delivery role
    const staff = await Staff.findOne({
      where: { StaffID: staffId, IsActive: true },
      include: [{
        model: Role,
        as: 'role',
        where: { RoleName: 'Delivery' }
      }]
    });

    if (!staff) {
      return res.status(400).json({ error: 'Invalid delivery staff' });
    }

    // Update delivery
    await delivery.update({
      DeliveryStaffID: staffId,
      Status: 'ASSIGNED',
      AssignedAt: new Date()
    });

    // Update order status
    await Order.update(
      { Status: 'OUT_FOR_DELIVERY' },
      { where: { OrderID: orderId } }
    );

    return res.json({
      success: true,
      message: 'Delivery staff assigned successfully'
    });
  } catch (error) {
    console.error('Assign delivery staff error:', error);
    return res.status(500).json({ error: 'Failed to assign delivery staff' });
  }
};

module.exports = exports;
