const { Delivery, Order, OrderItem, MenuItem, Address, Customer, Staff, DeliveryStaffAvailability, OrderStatusHistory, sequelize } = require('../models');
const { validateDeliveryDistanceWithFallback, geocodeAddress } = require('../utils/distanceValidator');
const { calculateEstimatedDeliveryTime } = require('../utils/deliveryEta');
const { validateAddressLine, validateCoordinates } = require('../utils/validationUtils');
const { calculateDeliveryFee, getDeliveryFeeConfig, estimateDeliveryFee } = require('../utils/deliveryFeeCalculator');

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

const isAdminRequest = (req) => req.user?.type === 'Staff' && req.user?.role === 'Admin';

/**
 * Get delivery dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const staffId = req.user.id;
    const isAdmin = isAdminRequest(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignmentScope = isAdmin ? {} : { DeliveryStaffID: staffId };

    // Active deliveries for this staff (or all when admin)
    const activeDeliveries = await Delivery.count({
      where: {
        ...assignmentScope,
        Status: {
          [sequelize.Sequelize.Op.in]: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
        }
      }
    });

    // Pending pickup
    const pendingPickup = await Delivery.count({
      where: {
        ...assignmentScope,
        Status: 'ASSIGNED'
      }
    });

    // Completed today
    const completedToday = await Delivery.count({
      where: {
        ...assignmentScope,
        Status: 'DELIVERED',
        DeliveredAt: {
          [sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    // Total completed
    const totalCompleted = await Delivery.count({
      where: {
        ...assignmentScope,
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
    const isAdmin = isAdminRequest(req);
    const { status } = req.query;

    const where = {};
    if (!isAdmin) {
      where.DeliveryStaffID = staffId;
    }

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
      order: [['AssignedAt', 'DESC'], ['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Get my deliveries error:', error);

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

    return res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

/**
 * Update delivery status
 * CRITICAL FIX: Now resets staff availability on DELIVERED/FAILED
 */
exports.updateDeliveryStatus = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { deliveryId } = req.params;
    const { status, notes, proof } = req.body;
    const staffId = req.user.id;
    const isAdmin = isAdminRequest(req);

    const delivery = await Delivery.findByPk(deliveryId, { transaction });

    if (!delivery) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Delivery staff can only update their own deliveries; admin can manage any delivery.
    if (!isAdmin && delivery.DeliveryStaffID !== staffId) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Unauthorized to update this delivery' });
    }

    // Validate status transitions
    const validTransitions = {
      'ASSIGNED': ['PICKED_UP', 'FAILED'],
      'PICKED_UP': ['IN_TRANSIT', 'FAILED'],
      'IN_TRANSIT': ['DELIVERED', 'FAILED']
    };

    if (!validTransitions[delivery.Status]?.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        error: `Cannot change status from ${delivery.Status} to ${status}`
      });
    }

    const previousStatus = delivery.Status;
    const updateData = { Status: status };

    if (status === 'PICKED_UP') {
      updateData.PickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.DeliveredAt = new Date();
      if (proof) {
        updateData.DeliveryProof = proof;
      }
    } else if (status === 'FAILED') {
      updateData.FailureReason = notes || 'Delivery failed';
    }

    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      updateData.EstimatedDeliveryTime = calculateEstimatedDeliveryTime({
        stage: status,
        distanceKm: Number(delivery.DistanceKm) || 0,
        baseTime: new Date()
      });
    }

    if (notes) {
      updateData.DeliveryNotes = notes;
    }

    await delivery.update(updateData, { transaction });

    // Fetch the current order to get its status BEFORE updating
    const order = await Order.findByPk(delivery.OrderID, { transaction });
    const previousOrderStatus = order ? order.Status : 'READY';

    // Update order status
    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      await Order.update(
        { Status: 'OUT_FOR_DELIVERY' },
        { where: { OrderID: delivery.OrderID }, transaction }
      );
    } else if (status === 'DELIVERED') {
      await Order.update(
        {
          Status: 'DELIVERED',
          CompletedAt: new Date()
        },
        { where: { OrderID: delivery.OrderID }, transaction }
      );
    } else if (status === 'FAILED') {
      await Order.update(
        { Status: 'READY' }, // Return to READY for reassignment
        { where: { OrderID: delivery.OrderID }, transaction }
      );
    }

    // CRITICAL FIX: Reset assignee availability when delivery is completed or failed
    if (status === 'DELIVERED' || status === 'FAILED') {
      const assigneeStaffId = delivery.DeliveryStaffID;

      if (assigneeStaffId) {
        await DeliveryStaffAvailability.update(
          {
            IsAvailable: true,
            CurrentOrderID: null,
            LastUpdated: new Date()
          },
          {
            where: { DeliveryStaffID: assigneeStaffId },
            transaction
          }
        );

        console.log(`[DELIVERY] ✅ Staff ${assigneeStaffId} availability reset (Status: ${status})`);
      }
    }

    await OrderStatusHistory.create({
      OrderID: delivery.OrderID,
      OldStatus: previousOrderStatus,
      NewStatus: status === 'DELIVERED' ? 'DELIVERED' : status === 'FAILED' ? 'READY' : 'OUT_FOR_DELIVERY',
      ChangedBy: staffId,
      ChangedByType: 'STAFF',
      Notes: notes || `Delivery status updated to ${status}`,
      CreatedAt: new Date()
    }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });
  } catch (error) {
    await transaction.rollback();
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
    const isAdmin = isAdminRequest(req);
    const { limit = 50, offset = 0 } = req.query;
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedOffset = Number.parseInt(offset, 10);
    const safeLimit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 200);
    const safeOffset = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0);

    const where = {
      Status: {
        [sequelize.Sequelize.Op.in]: ['DELIVERED', 'FAILED']
      }
    };

    if (!isAdmin) {
      where.DeliveryStaffID = staffId;
    }

    const deliveries = await Delivery.findAll({
      where,
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
      limit: safeLimit,
      offset: safeOffset
    });

    return res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Get delivery history error:', error);

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

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

    // Update or create availability record using upsert
    const [availability, created] = await DeliveryStaffAvailability.upsert({
      DeliveryStaffID: staffId,
      IsAvailable: isAvailable
    }, {
      returning: true
    });

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

    // Try to find existing availability record (let Sequelize handle field mapping)
    let availability = await DeliveryStaffAvailability.findOne({
      where: { DeliveryStaffID: staffId }
    });

    // If no record exists, create one with default availability (true)
    if (!availability) {
      availability = await DeliveryStaffAvailability.create({
        DeliveryStaffID: staffId,
        IsAvailable: true,
        CurrentOrderID: null
      });
    }

    return res.json({
      success: true,
      data: {
        IsAvailable: availability.IsAvailable,
        CurrentOrderID: availability.CurrentOrderID,
        LastUpdated: availability.updatedAt
      }
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
    const isAdmin = isAdminRequest(req);

    const where = { DeliveryID: deliveryId };
    if (!isAdmin) {
      where.DeliveryStaffID = staffId;
    }

    const delivery = await Delivery.findOne({
      where,
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
              as: 'items',
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

    if (isAddressTableMissingError(error)) {
      return res.status(503).json({ error: 'Address features are temporarily unavailable. Please contact support.' });
    }

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

    let lat = Number(latitude);
    let lng = Number(longitude);
    let hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

    // If coordinates not provided, try to geocode the address
    if (!hasCoordinates && address) {
      // Validate address has proper fields
      if (!address.addressLine1 || !validateAddressLine(address.addressLine1)) {
        return res.status(400).json({
          success: false,
          message: 'Address line must be at least 5 characters'
        });
      }

      try {
        const regionSegment = address.district || address.postalCode || '';
        const addressText = `${address.addressLine1}${address.city ? ', ' + address.city : ''}${regionSegment ? ', ' + regionSegment : ''}`;
        // Pass city parameter for fallback geocoding (when API key not configured)
        const geocoded = await geocodeAddress(addressText, address.city);
        lat = Number(geocoded.lat);
        lng = Number(geocoded.lng);
        hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

        // Log geocoding method used (for debugging)
        console.log(`[Distance Validation] Geocoded via: ${geocoded.method || 'google_full_address'} -> (${lat}, ${lng})`);
        
        // If using approximate location, inform the client
        if (geocoded.isApproximate) {
          console.log(`[Distance Validation] ⚠️ Using approximate coordinates for: ${address.city}`);
        }
      } catch (geocodeError) {
        console.error('[Distance Validation] Geocoding error:', geocodeError.message);
        return res.status(400).json({
          success: false,
          message: 'Unable to locate this address. For accurate delivery, please click "Use My Location" button to provide GPS coordinates.',
          error: geocodeError.message,
          suggestion: 'USE_GPS_LOCATION'
        });
      }
    }

    // If still no coordinates, reject
    if (!hasCoordinates) {
      return res.status(400).json({
        success: false,
        message: 'Address coordinates could not be determined. Please verify your address details.'
      });
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
      order: [[sequelize.literal('`DeliveryStaffAvailability`.`last_updated`'), 'ASC']]
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

    if (error?.original?.code === 'ER_BAD_FIELD_ERROR' || error?.parent?.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(503).json({
        success: false,
        message: 'Delivery location tracking is not available until migration_v2.2_delivery_location_tracking.sql is applied.'
      });
    }

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
 * SECURITY FIX: Now checks authorization before returning location
 */
exports.getDeliveryLocation = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const delivery = await Delivery.findOne({
      where: { DeliveryID: deliveryId },
      attributes: ['DeliveryID', 'CurrentLatitude', 'CurrentLongitude', 'LastLocationUpdate', 'Status', 'DeliveryStaffID', 'OrderID'],
      include: [{
        model: Order,
        as: 'order',
        attributes: ['CustomerID', 'OrderType']
      }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // SECURITY FIX: Check authorization
    const isDeliveryStaff = delivery.DeliveryStaffID === userId;
    const isCustomer = delivery.order?.CustomerID === userId;
    const isAdmin = req.user.type === 'Staff' && userRole === 'Admin';

    if (!isDeliveryStaff && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this delivery location'
      });
    }

    if (isCustomer) {
      if (delivery.order?.OrderType !== 'DELIVERY') {
        return res.status(400).json({
          success: false,
          message: 'Live location is only available for delivery orders'
        });
      }

      if (!delivery.DeliveryStaffID) {
        return res.status(409).json({
          success: false,
          message: 'Delivery person has not been assigned yet'
        });
      }
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

    if (error?.original?.code === 'ER_BAD_FIELD_ERROR' || error?.parent?.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(503).json({
        success: false,
        message: 'Delivery location tracking is not available until migration_v2.2_delivery_location_tracking.sql is applied.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery location',
      error: error.message
    });
  }
};

/**
 * Get delivery fee configuration
 * Public endpoint - returns the current delivery fee structure
 * 
 * GET /api/v1/delivery/fee-config
 */
exports.getDeliveryFeeConfig = async (req, res) => {
  try {
    const config = getDeliveryFeeConfig();

    res.json({
      success: true,
      data: {
        baseFee: config.baseFee,
        freeDeliveryDistance: config.freeDeliveryDistance,
        feePerKm: config.feePerKm,
        maxFee: config.maxFee,
        description: `Base fee of LKR ${config.baseFee} applies. Free delivery within ${config.freeDeliveryDistance}km. Additional LKR ${config.feePerKm} per km beyond that, capped at LKR ${config.maxFee}.`
      }
    });

  } catch (error) {
    console.error('Get delivery fee config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery fee configuration',
      error: error.message
    });
  }
};

/**
 * Calculate delivery fee for a given distance
 * Public endpoint - calculates the exact delivery fee with breakdown
 * 
 * POST /api/v1/delivery/calculate-fee
 * Body: { distanceKm: number }
 */
exports.calculateDeliveryFee = async (req, res) => {
  try {
    const { distanceKm } = req.body;
    const parsedDistanceKm = Number(distanceKm);

    if (!Number.isFinite(parsedDistanceKm) || parsedDistanceKm < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid distanceKm (number >= 0) is required'
      });
    }

    const feeCalculation = calculateDeliveryFee(parsedDistanceKm);

    res.json({
      success: true,
      data: {
        distanceKm: parsedDistanceKm,
        baseFee: feeCalculation.baseFee,
        distanceFee: feeCalculation.distanceFee,
        totalFee: feeCalculation.totalFee,
        breakdown: feeCalculation.breakdown,
        isFreeRange: feeCalculation.isFreeRange,
        isCapped: feeCalculation.isCapped || false
      }
    });

  } catch (error) {
    console.error('Calculate delivery fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate delivery fee',
      error: error.message
    });
  }
};

module.exports = exports;
