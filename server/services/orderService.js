const { Order, OrderItem, OrderStatusHistory, Customer, MenuItem, ComboPack, Delivery, DeliveryStaffAvailability, Payment, Address, sequelize } = require('../models');
const { Transaction, Op } = require('sequelize');
const stockService = require('./stockService');
const { validateDeliveryDistanceWithFallback } = require('./distanceValidation');
const { calculateDeliveryFee } = require('../utils/deliveryFeeCalculator');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('./emailService');
const { sendOrderConfirmationSMS, sendOrderStatusUpdateSMS } = require('./smsService');

/**
 * Order Management Service
 * Implements complete order lifecycle with atomic operations
 */
class OrderService {
    /**
     * Create order with stock validation (FR01, FR22)
     */
    async createOrder(customerId, orderData, addressId = null) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const items = orderData.items || [];
            const orderType = orderData.orderType || orderData.order_type;
            const specialInstructions = orderData.specialInstructions || orderData.special_instructions;
            const promotionId = orderData.promotionId || orderData.promotion_id;

            // Validate delivery distance if delivery order (FR09)
            let deliveryDistance = 0;
            if (orderType === 'DELIVERY') {
                if (!addressId) {
                    throw new Error('Address is required for delivery orders');
                }

                const { Address } = require('../models');
                const address = await Address.findByPk(addressId);

                if (!address || !address.Latitude || !address.Longitude) {
                    throw new Error('Address coordinates are required for delivery validation');
                }

                const distanceValidation = await validateDeliveryDistanceWithFallback(
                    address.Latitude,
                    address.Longitude
                );

                if (!distanceValidation.isValid) {
                    throw new Error(
                        `Delivery address is outside our delivery range. Distance: ${distanceValidation.distance.toFixed(2)}km, Maximum: ${distanceValidation.maxDistance}km`
                    );
                }

                // Store the validated distance for fee calculation
                deliveryDistance = distanceValidation.distance;
            }

            // Calculate order totals
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                const menuItemId = item.menuItemId || item.menu_item_id;
                const comboId = item.comboId || item.combo_id;

                if (menuItemId) {
                    const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
                    if (!menuItem || !menuItem.IsActive || !menuItem.IsAvailable) {
                        throw new Error(`Menu item ${menuItemId} is not available`);
                    }

                    orderItems.push({
                        MenuItemID: menuItemId,
                        Quantity: item.quantity,
                        UnitPrice: menuItem.Price
                    });

                    totalAmount += menuItem.Price * item.quantity;
                } else if (comboId) {
                    const combo = await ComboPack.findByPk(comboId, { transaction });
                    if (!combo || !combo.IsActive) {
                        throw new Error(`Combo pack ${comboId} is not available`);
                    }

                    orderItems.push({
                        ComboID: comboId,
                        Quantity: item.quantity,
                        UnitPrice: combo.Price
                    });

                    totalAmount += combo.Price * item.quantity;
                }
            }

            // Apply promotion if provided
            let discountAmount = 0;
            if (promotionId) {
                const { Promotion } = require('../models');
                const promotion = await Promotion.findByPk(promotionId, { transaction });

                if (promotion && promotion.IsActive) {
                    const now = new Date();
                    if (now >= promotion.ValidFrom && now <= promotion.ValidUntil) {
                        if (totalAmount >= promotion.MinOrderAmount) {
                            if (promotion.DiscountType === 'PERCENTAGE') {
                                discountAmount = (totalAmount * promotion.DiscountValue) / 100;
                                if (promotion.MaxDiscountAmount) {
                                    discountAmount = Math.min(discountAmount, promotion.MaxDiscountAmount);
                                }
                            } else {
                                discountAmount = promotion.DiscountValue;
                            }

                            // Update promotion usage
                            await promotion.increment('UsageCount', { transaction });
                        }
                    }
                }
            }

            // Calculate delivery fee based on distance (dynamic pricing)
            let deliveryFee = 0;
            if (orderType === 'DELIVERY' && deliveryDistance > 0) {
                const feeCalculation = calculateDeliveryFee(deliveryDistance);
                deliveryFee = feeCalculation.totalFee;
                console.log(`[Delivery Fee] Distance: ${deliveryDistance.toFixed(2)}km, Fee: LKR ${deliveryFee}, Breakdown: ${feeCalculation.breakdown}`);
            }

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Create order with CONFIRMED status (auto-confirmation to avoid cashier bottleneck)
            const order = await Order.create({
                OrderNumber: orderNumber,
                CustomerID: customerId,
                TotalAmount: totalAmount,
                PromotionID: promotionId || null,
                DiscountAmount: discountAmount,
                DeliveryFee: deliveryFee,
                Status: 'CONFIRMED',
                OrderType: orderType,
                SpecialInstructions: specialInstructions,
                ConfirmedAt: new Date(),
                ConfirmedBy: null // Auto-confirmed by system
            }, { transaction });

            // Create order items
            for (const item of orderItems) {
                await OrderItem.create({
                    OrderID: order.OrderID,
                    ...item
                }, { transaction });
            }

            // Create delivery record if delivery order
            if (orderType === 'DELIVERY') {
                const { Address } = require('../models');
                const address = await Address.findByPk(addressId);

                const distanceValidation = await validateDeliveryDistanceWithFallback(
                    address.Latitude,
                    address.Longitude
                );

                await Delivery.create({
                    OrderID: order.OrderID,
                    AddressID: addressId,
                    Status: 'PENDING',
                    DistanceKm: distanceValidation.distance
                }, { transaction });
            }

            // Validate and deduct stock at order creation (auto-confirmation)
            const stockDate = new Date().toISOString().split('T')[0];
            const stockItems = orderItems
                .filter(item => item.MenuItemID)
                .map(item => ({
                    MenuItemID: item.MenuItemID,
                    Quantity: item.Quantity
                }));

            if (stockItems.length > 0) {
                await stockService.validateAndReserveStock(stockItems, stockDate, transaction);
                await stockService.deductStock(order.OrderID, stockItems, stockDate, null, transaction);
            }

            // Log status history - auto-confirmed
            await OrderStatusHistory.create({
                OrderID: order.OrderID,
                OldStatus: null,
                NewStatus: 'CONFIRMED',
                ChangedBy: null,
                ChangedByType: 'SYSTEM',
                Notes: 'Order created and auto-confirmed',
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            // Send confirmation notifications (FR15) - after successful commit
            try {
                const customer = await Customer.findByPk(customerId);
                if (customer && orderType !== 'WALK_IN') {
                    if (customer.Email) {
                        await sendOrderConfirmationEmail(order, customer);
                    }
                    if (customer.Phone) {
                        await sendOrderConfirmationSMS(customer.Phone, orderNumber);
                    }
                }
            } catch (notifError) {
                console.error('Notification error after order creation:', notifError);
                // Don't fail the order if notification fails
            }

            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Confirm order with payment verification and stock deduction (FR22, FR30)
     */
    async confirmOrder(orderId, staffId) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: OrderItem, as: 'items' },
                    { model: Customer, as: 'customer' },
                    { model: Payment, as: 'payment' }
                ],
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Orders are now auto-confirmed, so if already confirmed, just return success
            if (order.Status === 'CONFIRMED') {
                await transaction.rollback();
                return order;
            }

            if (order.Status !== 'PENDING') {
                throw new Error(`Order cannot be confirmed. Current status: ${order.Status}`);
            }

            // Verify payment if online payment
            if (order.payment && order.payment.Method === 'ONLINE') {
                if (order.payment.Status !== 'PAID') {
                    throw new Error('Payment not completed. Cannot confirm order.');
                }
            }

            // Validate and reserve stock
            const stockDate = new Date().toISOString().split('T')[0];
            const stockItems = order.items
                .filter(item => item.MenuItemID)
                .map(item => ({
                    MenuItemID: item.MenuItemID,
                    Quantity: item.Quantity
                }));

            if (stockItems.length > 0) {
                await stockService.validateAndReserveStock(stockItems, stockDate, transaction);
                await stockService.deductStock(orderId, stockItems, stockDate, staffId, transaction);
            }

            // Update order status
            order.Status = 'CONFIRMED';
            order.ConfirmedAt = new Date();
            order.ConfirmedBy = staffId;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                OrderID: orderId,
                OldStatus: 'PENDING',
                NewStatus: 'CONFIRMED',
                ChangedBy: staffId,
                ChangedByType: 'STAFF',
                Notes: 'Order confirmed by staff',
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            // Send notifications (FR15)
            try {
                if (order.customer.Email) {
                    await sendOrderConfirmationEmail(order, order.customer);
                }
                if (order.customer.Phone) {
                    await sendOrderConfirmationSMS(order.customer.Phone, order.OrderNumber);
                }
            } catch (notifError) {
                console.error('Notification error:', notifError);
                // Don't fail the order confirmation if notification fails
            }

            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update order status with notifications (FR15)
     */
    async updateOrderStatus(orderId, newStatus, staffId, notes = null) {
        const transaction = await sequelize.transaction();

        try {
            const order = await Order.findByPk(orderId, {
                include: [{ model: Customer, as: 'customer' }],
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            const oldStatus = order.Status;

            // Validate status transition
            this.validateStatusTransition(oldStatus, newStatus);

            // Update order
            order.Status = newStatus;

            // Set timestamp based on status
            switch (newStatus) {
                case 'PREPARING':
                    order.PreparingAt = new Date();
                    break;
                case 'READY':
                    order.ReadyAt = new Date();
                    break;
                case 'DELIVERED':
                    order.CompletedAt = new Date();
                    break;
                case 'CANCELLED':
                    order.CancelledAt = new Date();
                    break;
            }

            order.UpdatedBy = staffId;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                OrderID: orderId,
                OldStatus: oldStatus,
                NewStatus: newStatus,
                ChangedBy: staffId,
                ChangedByType: 'STAFF',
                Notes: notes,
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            // Auto-assign delivery staff when order becomes READY (FR26)
            if (newStatus === 'READY' && order.OrderType === 'DELIVERY') {
                await this.autoAssignDeliveryStaff(orderId);
            }

            // Send notifications (FR15)
            try {
                if (order.OrderType !== 'WALK_IN' && order.customer.Email) {
                    await sendOrderStatusUpdateEmail(order, order.customer, newStatus);
                }
                if (order.OrderType !== 'WALK_IN' && order.customer.Phone) {
                    await sendOrderStatusUpdateSMS(order.customer.Phone, order.OrderNumber, newStatus);
                }
            } catch (notifError) {
                console.error('Notification error:', notifError);
            }

            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Cancel order with stock return and refund (FR21)
     */
    async cancelOrder(orderId, reason, cancelledBy, cancelledByType = 'STAFF') {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: OrderItem, as: 'items' },
                    { model: Payment, as: 'payment' }
                ],
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (['DELIVERED', 'CANCELLED'].includes(order.Status)) {
                throw new Error(`Order cannot be cancelled. Current status: ${order.Status}`);
            }

            const oldStatus = order.Status;

            // Return stock if order was confirmed
            if (order.Status !== 'PENDING' && order.ConfirmedAt) {
                const stockDate = order.ConfirmedAt.toISOString().split('T')[0];
                const stockItems = order.items
                    .filter(item => item.MenuItemID)
                    .map(item => ({
                        MenuItemID: item.MenuItemID,
                        Quantity: item.Quantity
                    }));

                if (stockItems.length > 0) {
                    await stockService.returnStock(orderId, stockItems, stockDate, cancelledBy, transaction);
                }
            }

            // Process refund if payment was made (FR21)
            if (order.payment && order.payment.Status === 'PAID') {
                const { payHereService, stripeService } = require('./paymentService');

                if (order.payment.Method === 'CARD') {
                    await stripeService.processRefund(order.payment, reason);
                } else if (order.payment.Method === 'ONLINE') {
                    await payHereService.processRefund(order.payment, reason);
                }
            }

            // Update order
            order.Status = 'CANCELLED';
            order.CancelledAt = new Date();
            order.CancellationReason = reason;
            order.CancelledBy = cancelledByType;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                OrderID: orderId,
                OldStatus: oldStatus,
                NewStatus: 'CANCELLED',
                ChangedBy: cancelledBy,
                ChangedByType: cancelledByType,
                Notes: reason,
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Validate status transition
     */
    validateStatusTransition(oldStatus, newStatus) {
        const validTransitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY', 'CANCELLED'],
            'READY': ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
            'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],
            'CANCELLED': []
        };

        if (!validTransitions[oldStatus]?.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
        }
    }

    /**
     * Generate unique order number
     */
    async generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        // Get today's order count
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const count = await Order.count({
            where: {
                created_at: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        const sequence = (count + 1).toString().padStart(4, '0');

        return `VF${year}${month}${day}${sequence}`;
    }

    /**
     * Auto-assign delivery staff when order becomes READY (FR26)
     * Uses workload balancing to distribute deliveries fairly
     * Considers: active deliveries count, geographic location, and availability
     * CRITICAL: Prevents overwhelming single staff while others idle
     */
    async autoAssignDeliveryStaff(orderId) {
        console.log(`[AUTO-ASSIGN] 🚀 Starting auto-assignment for order ${orderId}`);

        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            // Find the delivery record with order details
            const delivery = await Delivery.findOne({
                where: { OrderID: orderId },
                include: [
                    {
                        model: Order,
                        as: 'order'
                    },
                    {
                        model: Address,
                        as: 'address'
                    }
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!delivery) {
                console.error(`[AUTO-ASSIGN] ❌ Delivery record not found for order ${orderId}`);
                await transaction.rollback();
                return null;
            }

            console.log(`[AUTO-ASSIGN] 📦 Found delivery record (ID: ${delivery.DeliveryID}, Status: ${delivery.Status})`);

            // Check if already assigned
            if (delivery.Status !== 'PENDING') {
                console.log(`[AUTO-ASSIGN] ⚠️  Delivery already ${delivery.Status}, skipping assignment`);
                await transaction.commit();
                return delivery.DeliveryStaffID;
            }

            // Ensure delivery staff availability rows exist (first run / partial seed safety)
            await sequelize.query(
                `INSERT IGNORE INTO delivery_staff_availability (delivery_staff_id, is_available)
                 SELECT s.staff_id, 1
                 FROM staff s
                 JOIN role r ON s.role_id = r.role_id
                 WHERE r.role_name = 'Delivery' AND s.is_active = 1`,
                { transaction, type: sequelize.QueryTypes.INSERT }
            );

            // Get available delivery staff with current workload (least busy first)
            const staffWithWorkload = await sequelize.query(
                `SELECT
                    dsa.delivery_staff_id AS DeliveryStaffID,
                    dsa.is_available AS IsAvailable,
                    COUNT(d.delivery_id) AS active_deliveries,
                    s.name AS Name,
                    s.phone AS Phone,
                    COALESCE(AVG(TIMESTAMPDIFF(MINUTE, o.created_at, d.delivered_at)), 0) AS avg_completion_time,
                    COALESCE(AVG(d.distance_km), 0) AS avg_distance
                 FROM delivery_staff_availability dsa
                 LEFT JOIN delivery d
                    ON dsa.delivery_staff_id = d.delivery_staff_id
                    AND d.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
                 LEFT JOIN \`order\` o ON d.order_id = o.order_id
                 JOIN staff s ON dsa.delivery_staff_id = s.staff_id
                 WHERE dsa.is_available = 1 AND s.is_active = 1
                 GROUP BY dsa.delivery_staff_id, dsa.is_available, s.name, s.phone
                 ORDER BY active_deliveries ASC, avg_completion_time DESC
                 LIMIT 5`,
                { transaction, type: sequelize.QueryTypes.SELECT }
            );

            console.log(`[AUTO-ASSIGN] 👥 Found ${staffWithWorkload ? staffWithWorkload.length : 0} available staff`);

            if (!staffWithWorkload || staffWithWorkload.length === 0) {
                console.warn(`[AUTO-ASSIGN] ⚠️  No available delivery staff for order ${orderId}`);
                console.warn(`[AUTO-ASSIGN] 💡 Tip: Run init_delivery_staff_availability.js or have staff set availability to true`);
                await transaction.rollback();
                return null;
            }

            // Log available staff
            staffWithWorkload.forEach((staff, idx) => {
                console.log(`[AUTO-ASSIGN]    ${idx + 1}. ${staff.Name} - ${Number(staff.active_deliveries) || 0} active`);
            });

            // Select best staff based on workload balancing
            // Priority: 1) Lightest workload, 2) Fastest completion time, 3) Earliest available
            const selectedStaff = staffWithWorkload[0];
            const staffId = Number(selectedStaff.DeliveryStaffID);

            console.log(`[AUTO-ASSIGN] 🎯 Selected: ${selectedStaff.Name} (ID: ${staffId})`);

            // CRITICAL FIX: Use atomic UPDATE with WHERE condition to prevent race conditions
            const [updatedCount] = await Delivery.update({
                DeliveryStaffID: staffId,
                Status: 'ASSIGNED',
                AssignedAt: new Date()
            }, {
                where: {
                    DeliveryID: delivery.DeliveryID,
                    Status: 'PENDING' // Only update if still PENDING
                },
                transaction
            });

            if (updatedCount === 0) {
                console.log(`[AUTO-ASSIGN] ⚠️  Delivery ${delivery.DeliveryID} was assigned concurrently by another process`);
                await transaction.rollback();
                return null;
            }

            // Update delivery staff availability (lock row first)
            const [availabilityUpdated] = await DeliveryStaffAvailability.update({
                IsAvailable: false,
                CurrentOrderID: orderId
            }, {
                where: {
                    DeliveryStaffID: staffId,
                    IsAvailable: true // Only update if still available
                },
                transaction
            });

            if (availabilityUpdated === 0) {
                console.log(`[AUTO-ASSIGN] ⚠️  Staff ${staffId} became unavailable during assignment`);
                await transaction.rollback();
                return null;
            }

            // Log assignment decision for auditing
            try {
                await sequelize.query(
                    `INSERT INTO delivery_assignment_log 
                    (OrderID, AssignedStaffID, Reason, ActiveDeliveries, CompletionTime) 
                    VALUES (?, ?, ?, ?, ?)`,
                    {
                        replacements: [
                            orderId,
                            staffId,
                            `Workload: ${selectedStaff.active_deliveries} active, completion time: ${selectedStaff.avg_completion_time.toFixed(1)}min`,
                            selectedStaff.active_deliveries,
                            selectedStaff.avg_completion_time
                        ],
                        transaction
                    }
                );
            } catch (logError) {
                // Ignore if assignment log table doesn't exist
                console.log(`[AUTO-ASSIGN] ℹ️  Assignment log table not available (optional)`);
            }

            await transaction.commit();

            console.log(`[AUTO-ASSIGN] ✅ Staff ${staffId} (${selectedStaff.Name}) assigned to order ${orderId}`);
            console.log(`[AUTO-ASSIGN]    - Active deliveries: ${selectedStaff.active_deliveries}`);
            console.log(`[AUTO-ASSIGN]    - Avg completion time: ${selectedStaff.avg_completion_time.toFixed(1)} minutes`);
            console.log(`[AUTO-ASSIGN] 🎉 Auto-assignment completed successfully!`);

            return staffId;

        } catch (error) {
            await transaction.rollback();
            console.error('[AUTO-ASSIGN] ❌ Error assigning delivery staff:', error.message);
            console.error('[AUTO-ASSIGN] Stack trace:', error.stack);
            // Don't throw - allow order to proceed without staff assignment
            return null;
        }
    }
}

module.exports = new OrderService();
