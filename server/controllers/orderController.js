const { Order, OrderItem, MenuItem, ComboPack, Customer, DailyStock, StockMovement, sequelize } = require('../models');

// Generate unique order number
const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
};

// Validate stock availability
const validateStock = async (items, orderDate) => {
    for (const item of items) {
        if (item.menuItemId) {
            const stock = await DailyStock.findOne({
                where: {
                    MenuItemID: item.menuItemId,
                    StockDate: orderDate
                }
            });

            if (!stock) {
                const menuItem = await MenuItem.findByPk(item.menuItemId);
                throw new Error(`No stock record found for ${menuItem.Name} on ${orderDate}`);
            }

            const availableQty = stock.OpeningQuantity - stock.SoldQuantity + stock.AdjustedQuantity;
            if (availableQty < item.quantity) {
                const menuItem = await MenuItem.findByPk(item.menuItemId);
                throw new Error(`Insufficient stock for ${menuItem.Name}. Available: ${availableQty}, Requested: ${item.quantity}`);
            }
        }
    }
};

// Deduct stock on order confirmation
const deductStock = async (orderId, transaction) => {
    const orderItems = await OrderItem.findAll({
        where: { OrderID: orderId },
        include: [{ model: MenuItem, as: 'menuItem' }]
    });

    const today = new Date().toISOString().split('T')[0];

    for (const item of orderItems) {
        if (item.MenuItemID) {
            const stock = await DailyStock.findOne({
                where: {
                    MenuItemID: item.MenuItemID,
                    StockDate: today
                },
                transaction
            });

            if (stock) {
                stock.SoldQuantity += item.Quantity;
                await stock.save({ transaction });

                // Log stock movement
                await StockMovement.create({
                    MenuItemID: item.MenuItemID,
                    StockDate: today,
                    ChangeType: 'SALE',
                    QuantityChange: -item.Quantity,
                    ReferenceID: orderId,
                    ReferenceType: 'ORDER',
                    Notes: `Order #${orderId}`
                }, { transaction });
            }
        }
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { items, orderType, addressId, specialInstructions, promotionCode } = req.body;
        const customerId = req.user.id;

        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item'
            });
        }

        // Validate stock availability
        const today = new Date().toISOString().split('T')[0];
        await validateStock(items, today);

        // Calculate total amount
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            let unitPrice = 0;

            if (item.menuItemId) {
                const menuItem = await MenuItem.findByPk(item.menuItemId);
                if (!menuItem || !menuItem.IsActive) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Menu item ${item.menuItemId} is not available`
                    });
                }
                unitPrice = parseFloat(menuItem.Price);
            } else if (item.comboId) {
                const combo = await ComboPack.findByPk(item.comboId);
                if (!combo || !combo.IsActive) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Combo pack ${item.comboId} is not available`
                    });
                }
                unitPrice = parseFloat(combo.Price);
            }

            totalAmount += unitPrice * item.quantity;
            orderItemsData.push({
                MenuItemID: item.menuItemId || null,
                ComboID: item.comboId || null,
                Quantity: item.quantity,
                UnitPrice: unitPrice,
                ItemNotes: item.notes || null
            });
        }

        // Create order
        const order = await Order.create({
            OrderNumber: generateOrderNumber(),
            CustomerID: customerId,
            TotalAmount: totalAmount,
            DiscountAmount: 0,
            Status: 'PENDING',
            OrderType: orderType,
            SpecialInstructions: specialInstructions
        }, { transaction });

        // Create order items
        for (const itemData of orderItemsData) {
            await OrderItem.create({
                OrderID: order.OrderID,
                ...itemData
            }, { transaction });
        }

        await transaction.commit();

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
        await transaction.rollback();
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
        if (req.user.role === 'customer') {
            where.CustomerID = req.user.id;
        }

        if (status) where.Status = status;
        if (orderType) where.OrderType = orderType;
        if (startDate && endDate) {
            where.CreatedAt = {
                [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const orders = await Order.findAll({
            where,
            include: [
                { model: Customer, as: 'customer', attributes: ['CustomerID', 'Name', 'Phone'] },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        { model: MenuItem, as: 'menuItem' },
                        { model: ComboPack, as: 'combo' }
                    ]
                }
            ],
            order: [['CreatedAt', 'DESC']]
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
        if (req.user.role === 'customer' && order.CustomerID !== req.user.id) {
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
exports.confirmOrder = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, { transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.Status !== 'PENDING') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot confirm order with status ${order.Status}`
            });
        }

        // Deduct stock
        await deductStock(id, transaction);

        // Update order status
        order.Status = 'CONFIRMED';
        order.ConfirmedAt = new Date();
        order.ConfirmedBy = req.user.id;
        await order.save({ transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Order confirmed successfully',
            data: order
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Confirm order error:', error);
        res.status(500).json({
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

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY'],
            'READY': ['OUT_FOR_DELIVERY', 'DELIVERED'],
            'OUT_FOR_DELIVERY': ['DELIVERED', 'FAILED']
        };

        if (!validTransitions[order.Status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition: ${order.Status} → ${status}`
            });
        }

        // Update status and timestamp
        order.Status = status;
        if (status === 'CONFIRMED') order.ConfirmedAt = new Date();
        if (status === 'PREPARING') order.PreparingAt = new Date();
        if (status === 'READY') order.ReadyAt = new Date();
        if (status === 'DELIVERED') order.CompletedAt = new Date();
        if (status === 'CANCELLED') {
            order.CancelledAt = new Date();
            order.CancellationReason = notes;
        }

        await order.save();

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

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!['PENDING', 'CONFIRMED'].includes(order.Status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.Status = 'CANCELLED';
        order.CancelledAt = new Date();
        order.CancellationReason = reason;
        order.CancelledBy = req.user.role === 'customer' ? 'CUSTOMER' : 'ADMIN';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
};
