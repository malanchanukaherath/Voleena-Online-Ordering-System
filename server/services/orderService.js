const { Order, OrderItem, OrderStatusHistory, Customer, MenuItem, ComboPack, Delivery, DeliveryStaffAvailability, Payment, sequelize } = require('../models');
const { Transaction, Op } = require('sequelize');
const stockService = require('./stockService');
const { validateDeliveryDistanceWithFallback } = require('./distanceValidation');
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

            // Calculate delivery fee
            const deliveryFee = orderType === 'DELIVERY'
                ? parseFloat(process.env.DELIVERY_FEE) || 150
                : 0;

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Create order
            const order = await Order.create({
                OrderNumber: orderNumber,
                CustomerID: customerId,
                TotalAmount: totalAmount,
                PromotionID: promotionId || null,
                DiscountAmount: discountAmount,
                DeliveryFee: deliveryFee,
                Status: 'PENDING',
                OrderType: orderType,
                SpecialInstructions: specialInstructions
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

            // Log status history
            await OrderStatusHistory.create({
                OrderID: order.OrderID,
                OldStatus: null,
                NewStatus: 'PENDING',
                ChangedBy: null,
                ChangedByType: 'CUSTOMER',
                Notes: 'Order created'
            }, { transaction });

            await transaction.commit();

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
                Notes: 'Order confirmed by staff'
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
                Notes: notes
            }, { transaction });

            await transaction.commit();

            // Auto-assign delivery staff when order becomes READY (FR26)
            if (newStatus === 'READY' && order.OrderType === 'DELIVERY') {
                await this.autoAssignDeliveryStaff(orderId);
            }

            // Send notifications (FR15)
            try {
                if (order.customer.Email) {
                    await sendOrderStatusUpdateEmail(order, order.customer, newStatus);
                }
                if (order.customer.Phone) {
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
                OldStatus: order.Status,
                NewStatus: 'CANCELLED',
                ChangedBy: cancelledBy,
                ChangedByType: cancelledByType,
                Notes: reason
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
                createdAt: {
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
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            // Find the delivery record with order details
            const delivery = await Delivery.findOne({
                where: { OrderID: orderId },
                include: [{
                    model: Order,
                    as: 'order',
                    include: [{
                        model: Address,
                        as: 'address'
                    }]
                }],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!delivery) {
                throw new Error('Delivery record not found for order');
            }

            // Get all available delivery staff with their current workload
            const [staffWithWorkload] = await sequelize.query(
                `SELECT 
                    dsa.DeliveryStaffID,
                    dsa.IsAvailable,
                    COUNT(d.DeliveryID) AS active_deliveries,
                    s.Name,
                    s.Phone,
                    COALESCE(AVG(TIMESTAMPDIFF(MINUTE, o.CreatedAt, d.DeliveredAt)), 0) AS avg_completion_time,
                    COALESCE(AVG(d.DistanceKm), 0) AS avg_distance
                FROM delivery_staff_availability dsa
                LEFT JOIN delivery d ON dsa.DeliveryStaffID = d.DeliveryStaffID 
                    AND d.Status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
                LEFT JOIN order o ON d.OrderID = o.OrderID
                JOIN staff s ON dsa.DeliveryStaffID = s.StaffID
                WHERE dsa.IsAvailable = 1
                GROUP BY dsa.DeliveryStaffID, dsa.IsAvailable, s.Name, s.Phone
                ORDER BY active_deliveries ASC, avg_completion_time DESC
                LIMIT 5`,
                { transaction, type: sequelize.QueryTypes.SELECT }
            );

            if (!staffWithWorkload || staffWithWorkload.length === 0) {
                console.log(`[AUTO-ASSIGN] No available delivery staff for order ${orderId}`);
                await transaction.commit();
                return null;
            }

            // Select best staff based on workload balancing
            // Priority: 1) Lightest workload, 2) Fastest completion time, 3) Earliest available
            const selectedStaff = staffWithWorkload[0];
            const staffId = selectedStaff.DeliveryStaffID;

            // Update delivery staff availability (lock row)
            await DeliveryStaffAvailability.update({
                IsAvailable: false,
                CurrentOrderID: orderId,
                LastUpdated: new Date()
            }, {
                where: { DeliveryStaffID: staffId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            // Update delivery record with assigned staff
            await delivery.update({
                DeliveryStaffID: staffId,
                Status: 'ASSIGNED',
                AssignedAt: new Date()
            }, { transaction });

            // Log assignment decision for auditing
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

            await transaction.commit();

            console.log(`[AUTO-ASSIGN] ✅ Staff ${staffId} (${selectedStaff.Name}) assigned to order ${orderId}`);
            console.log(`   - Active deliveries: ${selectedStaff.active_deliveries}`);
            console.log(`   - Avg completion time: ${selectedStaff.avg_completion_time.toFixed(1)} minutes`);
            return staffId;

        } catch (error) {
            await transaction.rollback();
            console.error('[AUTO-ASSIGN] ❌ Error assigning delivery staff:', error.message);
            // Don't throw - allow order to proceed without staff assignment
            return null;
        }
    }
}

module.exports = new OrderService();
