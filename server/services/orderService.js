const { Order, OrderItem, OrderStatusHistory, Customer, MenuItem, ComboPack, Delivery, Payment, sequelize } = require('../models');
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
            const { items, order_type, special_instructions, promotion_id } = orderData;

            // Validate delivery distance if delivery order (FR09)
            if (order_type === 'DELIVERY') {
                if (!addressId) {
                    throw new Error('Address is required for delivery orders');
                }

                const { Address } = require('../models');
                const address = await Address.findByPk(addressId);

                if (!address || !address.latitude || !address.longitude) {
                    throw new Error('Address coordinates are required for delivery validation');
                }

                const distanceValidation = await validateDeliveryDistanceWithFallback(
                    address.latitude,
                    address.longitude
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
                if (item.menu_item_id) {
                    const menuItem = await MenuItem.findByPk(item.menu_item_id, { transaction });
                    if (!menuItem || !menuItem.is_active || !menuItem.is_available) {
                        throw new Error(`Menu item ${item.menu_item_id} is not available`);
                    }

                    orderItems.push({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity,
                        unit_price: menuItem.price
                    });

                    totalAmount += menuItem.price * item.quantity;
                } else if (item.combo_id) {
                    const combo = await ComboPack.findByPk(item.combo_id, { transaction });
                    if (!combo || !combo.is_active) {
                        throw new Error(`Combo pack ${item.combo_id} is not available`);
                    }

                    orderItems.push({
                        combo_id: item.combo_id,
                        quantity: item.quantity,
                        unit_price: combo.price
                    });

                    totalAmount += combo.price * item.quantity;
                }
            }

            // Apply promotion if provided
            let discountAmount = 0;
            if (promotion_id) {
                const { Promotion } = require('../models');
                const promotion = await Promotion.findByPk(promotion_id, { transaction });

                if (promotion && promotion.is_active) {
                    const now = new Date();
                    if (now >= promotion.valid_from && now <= promotion.valid_until) {
                        if (totalAmount >= promotion.min_order_amount) {
                            if (promotion.discount_type === 'PERCENTAGE') {
                                discountAmount = (totalAmount * promotion.discount_value) / 100;
                                if (promotion.max_discount_amount) {
                                    discountAmount = Math.min(discountAmount, promotion.max_discount_amount);
                                }
                            } else {
                                discountAmount = promotion.discount_value;
                            }

                            // Update promotion usage
                            await promotion.increment('usage_count', { transaction });
                        }
                    }
                }
            }

            // Calculate delivery fee
            const deliveryFee = order_type === 'DELIVERY'
                ? parseFloat(process.env.DELIVERY_FEE) || 150
                : 0;

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Create order
            const order = await Order.create({
                order_number: orderNumber,
                customer_id: customerId,
                total_amount: totalAmount,
                promotion_id: promotion_id || null,
                discount_amount: discountAmount,
                delivery_fee: deliveryFee,
                status: 'PENDING',
                order_type,
                special_instructions
            }, { transaction });

            // Create order items
            for (const item of orderItems) {
                await OrderItem.create({
                    order_id: order.order_id,
                    ...item
                }, { transaction });
            }

            // Create delivery record if delivery order
            if (order_type === 'DELIVERY') {
                const { Address } = require('../models');
                const address = await Address.findByPk(addressId);

                const distanceValidation = await validateDeliveryDistanceWithFallback(
                    address.latitude,
                    address.longitude
                );

                await Delivery.create({
                    order_id: order.order_id,
                    address_id: addressId,
                    status: 'PENDING',
                    distance_km: distanceValidation.distance
                }, { transaction });
            }

            // Log status history
            await OrderStatusHistory.create({
                order_id: order.order_id,
                old_status: null,
                new_status: 'PENDING',
                changed_by: null,
                changed_by_type: 'CUSTOMER',
                notes: 'Order created'
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

            if (order.status !== 'PENDING') {
                throw new Error(`Order cannot be confirmed. Current status: ${order.status}`);
            }

            // Verify payment if online payment
            if (order.payment && order.payment.method === 'ONLINE') {
                if (order.payment.status !== 'PAID') {
                    throw new Error('Payment not completed. Cannot confirm order.');
                }
            }

            // Validate and reserve stock
            const stockDate = new Date().toISOString().split('T')[0];
            const stockItems = order.items
                .filter(item => item.menu_item_id)
                .map(item => ({
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity
                }));

            if (stockItems.length > 0) {
                await stockService.validateAndReserveStock(stockItems, stockDate, transaction);
                await stockService.deductStock(orderId, stockItems, stockDate, staffId, transaction);
            }

            // Update order status
            order.status = 'CONFIRMED';
            order.confirmed_at = new Date();
            order.confirmed_by = staffId;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                order_id: orderId,
                old_status: 'PENDING',
                new_status: 'CONFIRMED',
                changed_by: staffId,
                changed_by_type: 'STAFF',
                notes: 'Order confirmed by staff'
            }, { transaction });

            await transaction.commit();

            // Send notifications (FR15)
            try {
                if (order.customer.email) {
                    await sendOrderConfirmationEmail(order, order.customer);
                }
                if (order.customer.phone) {
                    await sendOrderConfirmationSMS(order.customer.phone, order.order_number);
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

            const oldStatus = order.status;

            // Validate status transition
            this.validateStatusTransition(oldStatus, newStatus);

            // Update order
            order.status = newStatus;

            // Set timestamp based on status
            switch (newStatus) {
                case 'PREPARING':
                    order.preparing_at = new Date();
                    break;
                case 'READY':
                    order.ready_at = new Date();
                    break;
                case 'DELIVERED':
                    order.completed_at = new Date();
                    break;
                case 'CANCELLED':
                    order.cancelled_at = new Date();
                    break;
            }

            order.updated_by = staffId;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                order_id: orderId,
                old_status: oldStatus,
                new_status: newStatus,
                changed_by: staffId,
                changed_by_type: 'STAFF',
                notes
            }, { transaction });

            await transaction.commit();

            // Send notifications (FR15)
            try {
                if (order.customer.email) {
                    await sendOrderStatusUpdateEmail(order, order.customer, newStatus);
                }
                if (order.customer.phone) {
                    await sendOrderStatusUpdateSMS(order.customer.phone, order.order_number, newStatus);
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

            if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
                throw new Error(`Order cannot be cancelled. Current status: ${order.status}`);
            }

            // Return stock if order was confirmed
            if (order.status !== 'PENDING') {
                const stockDate = order.confirmed_at.toISOString().split('T')[0];
                const stockItems = order.items
                    .filter(item => item.menu_item_id)
                    .map(item => ({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity
                    }));

                if (stockItems.length > 0) {
                    await stockService.returnStock(orderId, stockItems, stockDate, cancelledBy, transaction);
                }
            }

            // Process refund if payment was made (FR21)
            if (order.payment && order.payment.status === 'PAID') {
                const { paymentService } = require('./paymentService');
                await paymentService.processRefund(order.payment, reason);
            }

            // Update order
            order.status = 'CANCELLED';
            order.cancelled_at = new Date();
            order.cancellation_reason = reason;
            order.cancelled_by = cancelledByType;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                order_id: orderId,
                old_status: order.status,
                new_status: 'CANCELLED',
                changed_by: cancelledBy,
                changed_by_type: cancelledByType,
                notes: reason
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
}

module.exports = new OrderService();
