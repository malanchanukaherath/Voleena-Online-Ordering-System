/**
 * Cart Controller
 * Handles cart validation and checkout preparation
 */

const { MenuItem, ComboPack, DailyStock } = require('../models');
const { validateCartItems } = require('../utils/validationUtils');

/**
 * Validate cart items against current stock
 * Checks if all items are available and have sufficient stock
 * 
 * POST /api/v1/cart/validate
 * 
 * Request body:
 * {
 *   items: [
 *     { menuItemId: 1, comboId: null, quantity: 2, notes: "Extra spicy" },
 *     { menuItemId: null, comboId: 1, quantity: 1, notes: null }
 *   ]
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     isValid: boolean,
 *     errors: [string],
 *     items: [
 *       { id, type, name, price, quantity, availability: {isAvailable, availableQty} }
 *     ]
 *   }
 * }
 */
exports.validateCart = async (req, res) => {
    try {
        const { items } = req.body;

        // Validate input
        const validation = validateCartItems(items);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart items',
                errors: validation.errors
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const validatedItems = [];
        const errors = [];

        for (const item of items) {
            try {
                if (item.menuItemId) {
                    // Validate menu item
                    const menuItem = await MenuItem.findByPk(item.menuItemId);
                    
                    if (!menuItem) {
                        errors.push(`Menu item ${item.menuItemId} not found`);
                        continue;
                    }

                    if (!menuItem.IsActive) {
                        errors.push(`Menu item "${menuItem.Name}" is no longer available`);
                        continue;
                    }

                    // Check stock
                    const dailyStock = await DailyStock.findOne({
                        where: {
                            MenuItemID: item.menuItemId,
                            StockDate: today
                        }
                    });

                    let availableQty = 0;
                    if (dailyStock) {
                        availableQty = dailyStock.OpeningQuantity - dailyStock.SoldQuantity + dailyStock.AdjustedQuantity;
                    }

                    const isAvailable = availableQty >= item.quantity;

                    validatedItems.push({
                        id: item.menuItemId,
                        type: 'menu',
                        name: menuItem.Name,
                        price: parseFloat(menuItem.Price),
                        quantity: item.quantity,
                        availability: {
                            isAvailable,
                            availableQty: Math.max(0, availableQty)
                        }
                    });

                    if (!isAvailable) {
                        errors.push(`Insufficient stock for "${menuItem.Name}". Available: ${availableQty}, Requested: ${item.quantity}`);
                    }

                } else if (item.comboId) {
                    // Validate combo pack
                    const combo = await ComboPack.findByPk(item.comboId);
                    
                    if (!combo) {
                        errors.push(`Combo pack ${item.comboId} not found`);
                        continue;
                    }

                    if (!combo.IsActive) {
                        errors.push(`Combo pack "${combo.Name}" is no longer available`);
                        continue;
                    }

                    // Combos don't have stock tracking, always available
                    validatedItems.push({
                        id: item.comboId,
                        type: 'combo',
                        name: combo.Name,
                        price: parseFloat(combo.Price),
                        quantity: item.quantity,
                        availability: {
                            isAvailable: true,
                            availableQty: null
                        }
                    });
                }

            } catch (itemError) {
                console.error('Error validating cart item:', itemError);
                errors.push(`Error validating item: ${itemError.message}`);
            }
        }

        const isValid = errors.length === 0;

        res.json({
            success: true,
            data: {
                isValid,
                errors,
                items: validatedItems,
                validatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Cart validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Cart validation failed',
            error: error.message
        });
    }
};

/**
 * Get cart summary with pricing
 * Includes subtotal, estimated delivery fee, tax
 * 
 * POST /api/v1/cart/summary
 */
exports.getCartSummary = async (req, res) => {
    try {
        const { items, orderType } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        let subtotal = 0;
        const itemDetails = [];

        for (const item of items) {
            if (item.menuItemId) {
                const menuItem = await MenuItem.findByPk(item.menuItemId);
                if (menuItem) {
                    const itemTotal = parseFloat(menuItem.Price) * item.quantity;
                    subtotal += itemTotal;
                    itemDetails.push({
                        name: menuItem.Name,
                        price: parseFloat(menuItem.Price),
                        quantity: item.quantity,
                        subtotal: itemTotal
                    });
                }
            } else if (item.comboId) {
                const combo = await ComboPack.findByPk(item.comboId);
                if (combo) {
                    const itemTotal = parseFloat(combo.Price) * item.quantity;
                    subtotal += itemTotal;
                    itemDetails.push({
                        name: combo.Name,
                        price: parseFloat(combo.Price),
                        quantity: item.quantity,
                        subtotal: itemTotal
                    });
                }
            }
        }

        // Calculate fees (no tax as per business decision)
        // Note: Delivery fee shown here is base fee only. Actual fee calculated at checkout based on distance.
        const BASE_DELIVERY_FEE = parseFloat(process.env.BASE_DELIVERY_FEE) || 100;
        const deliveryFee = orderType === 'DELIVERY' ? BASE_DELIVERY_FEE : 0;
        const total = subtotal + deliveryFee;

        res.json({
            success: true,
            data: {
                itemDetails,
                subtotal: parseFloat(subtotal.toFixed(2)),
                deliveryFee: parseFloat(deliveryFee.toFixed(2)),
                deliveryFeeNote: orderType === 'DELIVERY' ? 'Base fee only. Actual fee calculated based on delivery distance.' : null,
                total: parseFloat(total.toFixed(2)),
                orderType
            }
        });

    } catch (error) {
        console.error('Cart summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate cart summary',
            error: error.message
        });
    }
};

module.exports = exports;
