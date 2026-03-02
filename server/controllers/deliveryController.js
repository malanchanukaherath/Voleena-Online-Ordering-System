const { Delivery, Order, OrderItem, MenuItem, Address, Customer, Staff, DeliveryStaffAvailability, sequelize } = require('../models');
const { validateDeliveryDistanceWithFallback, geocodeAddress } = require('../utils/distanceValidator');
const { validateAddressLine, validateCoordinates } = require('../utils/validationUtils');

/**
 * Get delivery dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const staffId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active deliveries for this staff
    const activeDeliveries = await Delivery.count({
      where: {
        DeliveryStaffID: staffId,
        Status: {
          [sequelize.Sequelize.Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        }
      }
    });

    // Pending pickup
    const pendingPickup = await Delivery.count({
      where: {
        DeliveryStaffID: staffId,
        Status: 'ASSIGNED'
      }
    });

    // Completed today
    const completedToday = await Delivery.count({
      where: {
        DeliveryStaffID: staffId,
        Status: 'DELIVERED',
        DeliveredAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    // Total completed
    const totalCompleted = await Delivery.count({
      where: {
        DeliveryStaffID: staffId,
        Status: 'DELIVERED'
      }
    });

    return res.json({
      success: true,
      stats: {
        activeDeliveries,
        pendingPickup,
        completedToday,
        totalCompleted
      }
    });
  } catch (error) {
    console.error('Delivery dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get assigned deliveries for this staff
 */
exports.getMyDeliveries = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { status } = req.query;

    const where = { DeliveryStaffID: staffId };

    if (status) {
      where.Status = status;
    } else {
      // Default: show active deliveries
      where.Status = {
        [sequelize.Sequelize.Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
      };
    }

    const deliveries = await Delivery.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['OrderID', 'OrderNumber', 'FinalAmount', 'SpecialInstructions'],
          include: [
            {
              model: Customer,
              as: 'customer',
              attributes: ['CustomerID', 'Name', 'Phone', 'Email']
            },
            {
              model: OrderItem,
              as: 'items',
              include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: ['Name']
              }]
            }
          ]
        },
        {
          model: Address,
          as: 'address',
          attributes: ['AddressLine1', 'AddressLine2', 'City', 'District', 'PostalCode', 'Latitude', 'Longitude']
        }
      ],
      order: [['AssignedAt', 'ASC']]
    });

    return res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Get my deliveries error:', error);
    return res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

/**
 * Update delivery status
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, notes, proof } = req.body;
    const staffId = req.user.id;

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Verify this delivery belongs to this staff
    if (delivery.DeliveryStaffID !== staffId) {
      return res.status(403).json({ error: 'Unauthorized to update this delivery' });
    }

    // Validate status transitions
    const validTransitions = {
      'ASSIGNED': ['PICKED_UP'],
      'PICKED_UP': ['IN_TRANSIT'],
      'IN_TRANSIT': ['DELIVERED', 'FAILED']
    };

    if (!validTransitions[delivery.Status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot change status from ${delivery.Status} to ${status}`
      });
    }

    const updateData = { Status: status };

    if (status === 'PICKED_UP') {
      updateData.PickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.DeliveredAt = new Date();
      if (proof) {
        updateData.DeliveryProof = proof;
      }
    }

    if (notes) {
      updateData.DeliveryNotes = notes;
    }

    await delivery.update(updateData);

    // Update order status
    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      await Order.update(
        { Status: 'OUT_FOR_DELIVERY' },
        { where: { OrderID: delivery.OrderID } }
      );
    } else if (status === 'DELIVERED') {
      await Order.update(
        {
          Status: 'DELIVERED',
          CompletedAt: new Date()
        },
        { where: { OrderID: delivery.OrderID } }
      );
    }

    // Log status change
    await sequelize.query(
      `INSERT INTO order_status_history (OrderID, OldStatus, NewStatus, ChangedBy, ChangedByType, Notes)
       VALUES (?, ?, ?, ?, 'STAFF', ?)`,
      {
        replacements: [
          delivery.OrderID,
          delivery.Status,
          status === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
          staffId,
          notes || `Delivery status updated to ${status}`
        ],
        type: sequelize.QueryTypes.INSERT
      }
    );

    return res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    return res.status(500).json({ error: 'Failed to update delivery status' });
  }
};

/**
 * Get delivery history
 */
exports.getDeliveryHistory = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const deliveries = await Delivery.findAll({
      where: {
        DeliveryStaffID: staffId,
        Status: {
          [sequelize.Sequelize.Op.in]: ['DELIVERED', 'FAILED']
        }
      },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['OrderID', 'OrderNumber', 'FinalAmount'],
          include: [{
            model: Customer,
            as: 'customer',
            attributes: ['Name', 'Phone']
          }]
        },
        {
          model: Address,
          as: 'address',
          attributes: ['AddressLine1', 'City']
        }
      ],
      order: [['DeliveredAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Get delivery history error:', error);
    return res.status(500).json({ error: 'Failed to fetch delivery history' });
  }
};

/**
 * Update availability status
 */
exports.updateAvailability = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ error: 'isAvailable must be a boolean' });
    }

    // Update or create availability record
    const [result] = await sequelize.query(
      `INSERT INTO delivery_staff_availability (DeliveryStaffID, IsAvailable, LastUpdated)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE IsAvailable = ?, LastUpdated = NOW()`,
      {
        replacements: [staffId, isAvailable, isAvailable],
        type: sequelize.QueryTypes.INSERT
      }
    );

    return res.json({
      success: true,
      message: 'Availability updated successfully',
      isAvailable
    });
  } catch (error) {
    console.error('Update availability error:', error);
    return res.status(500).json({ error: 'Failed to update availability' });
  }
};

/**
 * Get current availability status
 */
exports.getAvailability = async (req, res) => {
  try {
    const staffId = req.user.id;

    const [availability] = await sequelize.query(
      `SELECT IsAvailable, CurrentOrderID, LastUpdated 
       FROM delivery_staff_availability 
       WHERE DeliveryStaffID = ?`,
      {
        replacements: [staffId],
        type: sequelize.QueryTypes.SELECT
      }
    );

    return res.json({
      success: true,
      data: availability || { IsAvailable: true, CurrentOrderID: null }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

/**
 * Get delivery details by ID
 */
exports.getDeliveryById = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const staffId = req.user.id;

    const delivery = await Delivery.findOne({
      where: {
        DeliveryID: deliveryId,
        DeliveryStaffID: staffId
      },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: Customer,
              as: 'customer'
            },
            {
              model: OrderItem,
              as: 'orderItems',
              include: [{
                model: MenuItem,
                as: 'menuItem'
              }]
            }
          ]
        },
        {
          model: Address,
          as: 'address'
        }
      ]
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    return res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Get delivery by ID error:', error);
    return res.status(500).json({ error: 'Failed to fetch delivery' });
  }
};
/**
 * Validate delivery distance for an address
 * Called during checkout to display distance and validate service area
 * 
 * POST /api/v1/delivery/validate-distance
 */
exports.validateDeliveryDistance = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    let lat = latitude;
    let lng = longitude;

    // If coordinates not provided, try to geocode the address
    if ((!lat || !lng) && address) {
      if (!validateAddressLine(address.addressLine1)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address provided'
        });
      }

      try {
        const addressText = `${address.addressLine1}${address.city ? ', ' + address.city : ''}${address.district ? ', ' + address.district : ''}`;
        const geocoded = await geocodeAddress(addressText);
        lat = geocoded.lat;
        lng = geocoded.lng;
      } catch (geocodeError) {
        return res.status(400).json({
          success: false,
          message: 'Unable to locate this address. Please check the address details.',
          error: geocodeError.message
        });
      }
    }

    // Validate coordinates
    if (!validateCoordinates(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Validate distance with fallback
    const validation = await validateDeliveryDistanceWithFallback(lat, lng);

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Distance validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate delivery distance',
      error: error.message
    });
  }
};

/**
 * Get available delivery staff (Admin/Operator endpoint)
 */
exports.getAvailableDeliveryStaff = async (req, res) => {
  try {
    const availableStaff = await DeliveryStaffAvailability.findAll({
      where: { IsAvailable: true },
      include: [
        {
          model: Staff,
          as: 'staff',
          attributes: ['StaffID', 'Name', 'Phone', 'Email']
        }
      ],
      order: [['LastUpdated', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        count: availableStaff.length,
        staff: availableStaff.map(item => ({
          id: item.staff.StaffID,
          name: item.staff.Name,
          phone: item.staff.Phone,
          email: item.staff.Email,
          lastUpdated: item.LastUpdated
        }))
      }
    });

  } catch (error) {
    console.error('Get available staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available delivery staff',
      error: error.message
    });
  }
};

/**
 * Track delivery rider's current location
 * POST /api/delivery/:deliveryId/location
 * Body: { lat: number, lng: number }
 */
exports.trackDeliveryLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { lat, lng } = req.body;
    const staffId = req.user.id;

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.'
      });
    }

    // Verify ownership - staff can only track their own deliveries
    const delivery = await Delivery.findOne({
      where: {
        DeliveryID: deliveryId,
        DeliveryStaffID: staffId
      }
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or not assigned to you'
      });
    }

    // Update delivery with current location
    await delivery.update({
      CurrentLatitude: lat,
      CurrentLongitude: lng,
      LastLocationUpdate: new Date()
    });

    res.json({
      success: true,
      message: 'Location tracked successfully',
      data: {
        deliveryId: delivery.DeliveryID,
        lat: lat,
        lng: lng,
        timestamp: delivery.LastLocationUpdate
      }
    });

  } catch (error) {
    console.error('Track delivery location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track delivery location',
      error: error.message
    });
  }
};

/**
 * Get delivery rider's live location (for admin/customer tracking)
 * GET /api/delivery/:deliveryId/location
 */
exports.getDeliveryLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const delivery = await Delivery.findOne({
      where: { DeliveryID: deliveryId },
      attributes: ['DeliveryID', 'CurrentLatitude', 'CurrentLongitude', 'LastLocationUpdate', 'Status']
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      data: {
        deliveryId: delivery.DeliveryID,
        lat: delivery.CurrentLatitude,
        lng: delivery.CurrentLongitude,
        lastUpdate: delivery.LastLocationUpdate,
        status: delivery.Status
      }
    });

  } catch (error) {
    console.error('Get delivery location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery location',
      error: error.message
    });
  }
};

module.exports = exports;
