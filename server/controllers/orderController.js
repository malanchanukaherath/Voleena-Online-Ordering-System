const { Order, OrderItem, MenuItem, ComboPack, Customer, Delivery, Address, sequelize } = require('../models');
const orderService = require('../services/orderService');

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const { items, orderType, addressId, specialInstructions, promotionCode } = req.body;
        const customerId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }
        const orderData = {
            orderType,
            specialInstructions,
            promotionId: promotionCode || null,
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
        res.status(500).json({
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
                // Prioritize action-required statuses: Orders are auto-confirmed, prioritize by status
                // PENDING (rare), CONFIRMED, PREPARING, READY, then others
                sequelize.literal("CASE WHEN `Order`.Status = 'PENDING' THEN 0 WHEN `Order`.Status = 'CONFIRMED' THEN 1 WHEN `Order`.Status = 'PREPARING' THEN 2 WHEN `Order`.Status = 'READY' THEN 3 ELSE 4 END"),
                // Then show newest orders first
                ['created_at', 'DESC']
            ]
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
                    include: [{
                        model: Address,
                        as: 'address'
                    }]
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
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
};

// Cancel order - ATOMIC transaction with stock restoration
// CRITICAL: Must restore stock before changing order status
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const cancelledByType = req.user.type === 'Customer'
            ? 'CUSTOMER'
            : req.user.role === 'Cashier'
                ? 'CASHIER'
                : 'ADMIN';

        const order = await orderService.cancelOrder(id, reason, req.user.id, cancelledByType);

        res.json({
            success: true,
            message: 'Order cancelled successfully, stock restored',
            data: order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to cancel order. Please try again.'
        });
    }
};
