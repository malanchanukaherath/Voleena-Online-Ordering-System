const { Order, OrderItem, MenuItem, ComboPack, Customer, Delivery, Address, Staff, sequelize } = require('../models');
const orderService = require('../services/orderService');
const {
    getAllowedAddOnsForOrderItem,
    buildOrderItemAddOnState,
    toMoney
} = require('../utils/orderAddOnUtils');

const ALLOWED_PAYMENT_METHODS = new Set(['CASH', 'CARD', 'ONLINE']);
const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '');

const isAddressTableMissingError = (error) => {
    const mysqlCode = error?.original?.code || error?.parent?.code;
    const message = [error?.message, error?.original?.sqlMessage, error?.parent?.sqlMessage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return error?.code === 'ADDRESS_TABLE_UNAVAILABLE'
        || (mysqlCode === 'ER_NO_SUCH_TABLE' && message.includes('address'))
        || (message.includes('no such table') && message.includes('address'))
        || (message.includes("doesn't exist") && message.includes('address'));
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            orderType,
            addressId,
            specialInstructions,
            promotionCode,
            paymentMethod = 'CASH',
            deliveryCoordinates = null,
            contactPhone
        } = req.body;
        const customerId = req.user.id;
        const normalizedPaymentMethod = typeof paymentMethod === 'string' ? paymentMethod.trim().toUpperCase() : '';
        const normalizedContactPhone = contactPhone === undefined || contactPhone === null
            ? null
            : normalizePhone(contactPhone);

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        if (normalizedContactPhone && !/^[+]?[0-9]{9,15}$/.test(normalizedContactPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact phone number format'
            });
        }

        if (!ALLOWED_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Unsupported payment method'
            });
        }

        const orderData = {
            orderType,
            specialInstructions,
            promotionId: promotionCode || null,
            paymentMethod: normalizedPaymentMethod,
            deliveryCoordinates,
            contactPhone: normalizedContactPhone,
            items: items.map((item) => ({
                menuItemId: item.menuItemId || null,
                comboId: item.comboId || null,
                quantity: item.quantity,
                notes: item.notes || null
            }))
        };

        const order = await orderService.createOrder(customerId, orderData, addressId);

        // Fetch complete order with items
        const completeOrder = await Order.findByPk(order.OrderID, {
            include: [{
                model: OrderItem,
                as: 'items',
                include: [
                    { model: MenuItem, as: 'menuItem' },
                    { model: ComboPack, as: 'combo' }
                ]
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: completeOrder
        });

    } catch (error) {
        console.error('Create order error:', error);

        if (isAddressTableMissingError(error)) {
            return res.status(503).json({
                success: false,
                message: 'Address features are temporarily unavailable. Please contact support.'
            });
        }

        const statusCode = error.statusCode
            || (/unsupported payment|disabled by system settings|minimum order amount|maximum order amount|required|outside our delivery|not available|invalid/i.test(error.message)
                ? 400
                : 500);

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to create order'
        });
    }
};

// Get all orders (with role-based filtering)
exports.getAllOrders = async (req, res) => {
    try {
        const { status, orderType, startDate, endDate } = req.query;
        const where = {};

        // Customer can only see their own orders
        if (req.user.type === 'Customer') {
            where.CustomerID = req.user.id;
        }

        if (status) where.Status = status;
        if (orderType) where.OrderType = orderType;
        if (startDate && endDate) {
            where.created_at = {
                [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const orders = await Order.findAll({
            where,
            include: [
                { model: Customer, as: 'customer', attributes: ['CustomerID', 'Name', 'Phone'] },
                { model: require('../models').Payment, as: 'payment', attributes: ['Method', 'Status', 'Amount'] },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        { model: MenuItem, as: 'menuItem' },
                        { model: ComboPack, as: 'combo' }
                    ]
                }
            ],
            order: [
                // Prioritize action-required statuses.
                sequelize.literal("CASE WHEN `Order`.Status = 'CONFIRMED' THEN 0 WHEN `Order`.Status = 'PREPARING' THEN 1 WHEN `Order`.Status = 'READY' THEN 2 ELSE 3 END"),
                // Then show newest orders first
                ['created_at', 'DESC']
            ],
            limit: 50 // Performance Bug Fix: Prevent server crash by limiting items to 50 at a time
        });

        res.json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

// Get single order
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, {
            include: [
                { model: Customer, as: 'customer' },
                { model: require('../models').Payment, as: 'payment', attributes: ['Method', 'Status', 'Amount'] },
                {
                    model: Delivery,
                    as: 'delivery',
                    attributes: [
                        'DeliveryID',
                        'OrderID',
                        'DeliveryStaffID',
                        'AddressID',
                        'Status',
                        'AssignedAt',
                        'PickedUpAt',
                        'DeliveredAt',
                        'EstimatedDeliveryTime',
                        'DeliveryProof',
                        'DeliveryNotes',
                        'FailureReason',
                        'DistanceKm',
                        'created_at',
                        'updated_at'
                    ],
                    include: [
                        {
                            model: Address,
                            as: 'address'
                        },
                        {
                            model: Staff,
                            as: 'deliveryStaff',
                            attributes: ['StaffID', 'Name', 'Phone']
                        }
                    ]
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        { model: MenuItem, as: 'menuItem' },
                        { model: ComboPack, as: 'combo' }
                    ]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Customer can only view their own orders
        if (req.user.type === 'Customer' && order.CustomerID !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get order error:', error);

        if (isAddressTableMissingError(error)) {
            return res.status(503).json({
                success: false,
                message: 'Address features are temporarily unavailable. Please contact support.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
};

// Confirm order (Admin/Cashier only)
// CRITICAL: Uses SERIALIZABLE isolation level to prevent race conditions
exports.confirmOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await orderService.confirmOrder(id, req.user.id);

        res.json({
            success: true,
            message: 'Order confirmed successfully',
            data: order
        });

    } catch (error) {
        console.error('Confirm order error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to confirm order'
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const order = await orderService.updateOrderStatus(id, status, req.user.id, notes);

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        const message = error.message || 'Failed to update order status';
        const statusCode = /order not found/i.test(message)
            ? 404
            : /invalid status transition/i.test(message)
                ? 400
                : 500;

        res.status(statusCode).json({
            success: false,
            message: statusCode === 500 ? 'Failed to update order status' : message
        });
    }
};

// Cancel order - ATOMIC transaction with stock restoration
// CRITICAL: Must restore stock before changing order status
// Uses SERIALIZABLE transaction to ensure atomicity
// All validations done in middleware (validateOrderCancellation)
exports.cancelOrder = async (req, res) => {
    // Audit timestamp for logging
    const startTime = Date.now();
    
    try {
        const { id } = req.params;
        const { reason } = req.body;
        let cancelledByType;
        if (req.user.type === 'Customer') {
            cancelledByType = 'CUSTOMER';
        } else if (req.user.type === 'Staff' && req.user.role === 'Cashier') {
            cancelledByType = 'CASHIER';
        } else if (req.user.type === 'Staff' && req.user.role === 'Admin') {
            cancelledByType = 'ADMIN';
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only customers, cashiers, or admins can cancel orders'
            });
        }

        // Log cancellation attempt for auditing
        console.log(`[AUDIT] Order cancellation attempt - OrderID: ${id}, User: ${req.user.id}, Type: ${cancelledByType}, Reason: ${reason.substring(0, 50)}...`);

        const order = await orderService.cancelOrder(id, reason, req.user.id, cancelledByType);

        // Log successful cancellation
        const duration = Date.now() - startTime;
        console.log(`[AUDIT] Order cancelled successfully - OrderID: ${id}, Duration: ${duration}ms, StockRestored: ${order.items?.length || 0} items`);

        res.json({
            success: true,
            message: 'Order cancelled successfully, stock restored',
            data: order
        });

    } catch (error) {
        // Log cancellation failure for debugging
        const duration = Date.now() - startTime;
        console.error(`[AUDIT] Order cancellation failed - OrderID: ${req.params.id}, User: ${req.user?.id}, Duration: ${duration}ms, Error: ${error.message}`);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to cancel order. Please try again.'
        });
    }
};

// Get add-on options for each order item (customer only)
exports.getOrderAddOnOptions = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, {
            include: [
                {
                    model: require('../models').Payment,
                    as: 'payment',
                    attributes: ['Method', 'Status', 'Amount']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        { model: MenuItem, as: 'menuItem' },
                        { model: ComboPack, as: 'combo' }
                    ]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (req.user.type !== 'Customer' || order.CustomerID !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const paymentMethod = String(order.payment?.Method || '').toUpperCase();
        const paymentStatus = String(order.payment?.Status || '').toUpperCase();
        const canCustomize = order.Status === 'CONFIRMED' && paymentMethod === 'CASH' && paymentStatus !== 'PAID';

        let reason = null;
        if (!canCustomize) {
            if (order.Status !== 'CONFIRMED') {
                reason = 'Order customization is available only before preparation starts';
            } else if (paymentMethod !== 'CASH') {
                reason = 'Order customization is currently available only for cash on delivery orders';
            } else if (paymentStatus === 'PAID') {
                reason = 'Order cannot be customized after payment is completed';
            }
        }

        const items = (order.items || []).map((entry) => {
            const allowedAddOns = getAllowedAddOnsForOrderItem(entry);
            const currentState = buildOrderItemAddOnState(entry, allowedAddOns);

            return {
                orderItemId: entry.OrderItemID,
                itemType: entry.MenuItemID ? 'MENU' : 'COMBO',
                itemId: entry.MenuItemID || entry.ComboID,
                itemName: entry.menuItem?.Name || entry.combo?.Name || 'Item',
                quantity: Number(entry.Quantity || 0),
                baseUnitPrice: currentState.baseUnitPrice,
                unitPrice: toMoney(entry.UnitPrice),
                addOnsPerUnit: currentState.selectedAddOnsPerUnit,
                selectedAddOns: currentState.selectedAddOns,
                availableAddOns: allowedAddOns,
                canCustomize: canCustomize && allowedAddOns.length > 0
            };
        });

        return res.json({
            success: true,
            data: {
                orderId: order.OrderID,
                status: order.Status,
                paymentMethod,
                paymentStatus,
                canCustomize,
                reason,
                items
            }
        });
    } catch (error) {
        console.error('Get order add-on options error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch order add-on options' });
    }
};

// Update selected add-ons for a specific order item (customer only)
exports.updateOrderItemAddOns = async (req, res) => {
    try {
        const { id, orderItemId } = req.params;
        const addOns = Array.isArray(req.body?.addOns) ? req.body.addOns : [];

        const result = await orderService.updateOrderItemAddOns(id, orderItemId, req.user.id, addOns);

        return res.json({
            success: true,
            message: 'Order item add-ons updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Update order item add-ons error:', error);

        const statusCode = /not found/i.test(error.message)
            ? 404
            : /access denied/i.test(error.message)
                ? 403
                : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to update order item add-ons'
        });
    }
};
