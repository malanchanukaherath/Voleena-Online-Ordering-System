// CODEMAP: BACKEND_ORDER_CONTROLLER
// PURPOSE: Handle HTTP request/response for order operations.
// SEARCH_HINT: Read this after routes, then jump to orderService.
const { Order, OrderItem, MenuItem, ComboPack, Customer, Delivery, Address, Staff, sequelize } = require('../models');
const orderService = require('../services/orderService');

const ALLOWED_PAYMENT_METHODS = new Set(['CASH', 'CARD', 'ONLINE']);
const CASHIER_ALLOWED_TRANSITIONS = new Set([
    'PENDING->CONFIRMED',
    'PENDING->CANCELLED',
    'PREORDER_PENDING->PREORDER_CONFIRMED',
    'PREORDER_PENDING->CANCELLED',
    'PREORDER_CONFIRMED->CONFIRMED',
    'PREORDER_CONFIRMED->CANCELLED',
    'CONFIRMED->CANCELLED'
]);
const KITCHEN_ALLOWED_TRANSITIONS = new Set([
    'CONFIRMED->PREPARING',
    'PREPARING->READY'
]);

// Simple: This cleans or formats the phone.
const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '');

// Simple: This converts query values to booleans.
const toBooleanQuery = (value) => {
    if (typeof value !== 'string') return undefined;

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;

    return undefined;
};

// Simple: This checks whether staff can change this status.
const canStaffTransitionStatus = (role, fromStatus, toStatus) => {
    if (role === 'Admin') {
        return true;
    }

    const transitionKey = `${fromStatus}->${toStatus}`;

    if (role === 'Cashier') {
        return CASHIER_ALLOWED_TRANSITIONS.has(transitionKey);
    }

    if (role === 'Kitchen') {
        return KITCHEN_ALLOWED_TRANSITIONS.has(transitionKey);
    }

    // Delivery staff should use delivery-specific routes.
    return false;
};

// Simple: This checks whether address table missing error is true.
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
            contactPhone,
            isPreorder = false,
            scheduledDatetime = null
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
            isPreorder: Boolean(isPreorder),
            scheduledDatetime: scheduledDatetime || null,
            items: items.map((item) => ({
                menuItemId: item.menuItemId || null,
                comboId: item.comboId || null,
                quantity: item.quantity,
                notes: item.notes || null,
                addOns: Array.isArray(item.addOns) ? item.addOns : []
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
            || (/unsupported payment|disabled by system settings|minimum order amount|maximum order amount|required|outside our delivery|not available|invalid|preorder|scheduled/i.test(error.message)
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
        const { status, orderType, startDate, endDate, approvalStatus, limit, offset } = req.query;
        const where = {};
        const parsedLimit = Number.parseInt(limit, 10);
        const parsedOffset = Number.parseInt(offset, 10);
        const safeLimit = Number.isInteger(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), 200)
            : 50;
        const safeOffset = Number.isInteger(parsedOffset)
            ? Math.max(parsedOffset, 0)
            : 0;
        const isPreorderFilter = toBooleanQuery(req.query.isPreorder);

        // Customer can only see their own orders
        if (req.user.type === 'Customer') {
            where.CustomerID = req.user.id;
        }

        if (status) where.Status = status;
        if (orderType) where.OrderType = orderType;
        if (approvalStatus) where.ApprovalStatus = String(approvalStatus).toUpperCase();
        if (isPreorderFilter !== undefined) where.IsPreorder = isPreorderFilter;
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
                sequelize.literal("CASE WHEN `Order`.Status = 'PREORDER_PENDING' THEN 0 WHEN `Order`.Status = 'PREORDER_CONFIRMED' THEN 1 WHEN `Order`.Status = 'CONFIRMED' THEN 2 WHEN `Order`.Status = 'PREPARING' THEN 3 WHEN `Order`.Status = 'READY' THEN 4 ELSE 5 END"),
                // Then show newest orders first
                ['created_at', 'DESC']
            ],
            limit: safeLimit,
            offset: safeOffset
        });

        res.json({
            success: true,
            data: orders,
            meta: {
                limit: safeLimit,
                offset: safeOffset,
                returnedCount: orders.length
            }
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

        const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';
        if (!normalizedStatus) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const orderToUpdate = await Order.findByPk(id, {
            attributes: ['OrderID', 'Status']
        });

        if (!orderToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!canStaffTransitionStatus(req.user.role, orderToUpdate.Status, normalizedStatus)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} cannot change status from ${orderToUpdate.Status} to ${normalizedStatus}`
            });
        }

        const order = await orderService.updateOrderStatus(id, normalizedStatus, req.user.id, notes);

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
