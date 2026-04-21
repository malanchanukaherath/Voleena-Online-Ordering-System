// CODEMAP: BACKEND_CONTROLLER_CARTCONTROLLER
// PURPOSE: Handles incoming requests, processes logic, and returns responses.
// SEARCH_HINT: Look here for request handling logic and data processing.
/**
 * Cart Controller
 * Handles cart validation and checkout preparation
 */

const { MenuItem, ComboPack, ComboPackItem, DailyStock } = require('../models');
const { validateCartItems } = require('../utils/validationUtils');
const systemSettingsService = require('../services/systemSettingsService');

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
// Frontend connection: Cart and Checkout pages (customer cart validation and totals).
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
                    const combo = await ComboPack.findByPk(item.comboId, {
                        include: [{
                            model: ComboPackItem,
                            as: 'items',
                            include: [{
                                model: MenuItem,
                                as: 'menuItem'
                            }]
                        }]
                    });
                    
                    if (!combo) {
                        errors.push(`Combo pack ${item.comboId} not found`);
                        continue;
                    }

                    if (!combo.IsActive) {
                        errors.push(`Combo pack "${combo.Name}" is no longer available`);
                        continue;
                    }

                    if (!Array.isArray(combo.items) || combo.items.length === 0) {
                        errors.push(`Combo pack "${combo.Name}" has no items configured`);
                        continue;
                    }

                    let isComboAvailable = true;
                    let availableComboQty = null;
                    const comboIssues = [];

                    for (const comboItem of combo.items) {
                        const componentQty = Number(comboItem.Quantity || 0);
                        const componentRequiredQty = componentQty * Number(item.quantity || 0);
                        const componentMenuItem = comboItem.menuItem;

                        if (componentQty <= 0) {
                            isComboAvailable = false;
                            comboIssues.push(`item ${comboItem.MenuItemID} has invalid combo quantity`);
                            continue;
                        }

                        if (!componentMenuItem || !componentMenuItem.IsActive) {
                            isComboAvailable = false;
                            comboIssues.push(`item ${comboItem.MenuItemID} is unavailable`);
                            continue;
                        }

                        const dailyStock = await DailyStock.findOne({
                            where: {
                                MenuItemID: comboItem.MenuItemID,
                                StockDate: today
                            }
                        });

                        let componentAvailableQty = 0;
                        if (dailyStock) {
                            componentAvailableQty = dailyStock.OpeningQuantity - dailyStock.SoldQuantity + dailyStock.AdjustedQuantity;
                        }

                        const possibleCombosFromThisItem = componentQty > 0
                            ? Math.floor(Math.max(0, componentAvailableQty) / componentQty)
                            : 0;
                        availableComboQty = availableComboQty === null
                            ? possibleCombosFromThisItem
                            : Math.min(availableComboQty, possibleCombosFromThisItem);

                        if (componentAvailableQty < componentRequiredQty) {
                            isComboAvailable = false;
                            comboIssues.push(`"${componentMenuItem.Name}" available: ${componentAvailableQty}, required: ${componentRequiredQty}`);
                        }
                    }

                    validatedItems.push({
                        id: item.comboId,
                        type: 'combo',
                        name: combo.Name,
                        price: parseFloat(combo.Price),
                        quantity: item.quantity,
                        availability: {
                            isAvailable: isComboAvailable,
                            availableQty: availableComboQty === null ? 0 : availableComboQty
                        }
                    });

                    if (!isComboAvailable) {
                        errors.push(`Insufficient stock for combo "${combo.Name}". ${comboIssues.join('; ')}`);
                    }
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
 * Includes subtotal and estimated delivery fee
 * 
 * POST /api/v1/cart/summary
 */
// Frontend connection: Cart and Checkout pages (customer cart validation and totals).
exports.getCartSummary = async (req, res) => {
    try {
        const { items, orderType } = req.body;
        const runtimeSettings = await systemSettingsService.getRuntimeSettings();

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

        // Calculate fees (business decision: delivery fee only)
        // Note: Delivery fee shown here is base fee only. Actual fee calculated at checkout based on distance.
        const configuredBaseDeliveryFee = Number(runtimeSettings.deliveryFee || 0);
        const freeDeliveryThreshold = Number(runtimeSettings.freeDeliveryThreshold || 0);
        const isFreeByOrderValue = freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
        const deliveryFee = orderType === 'DELIVERY' ? (isFreeByOrderValue ? 0 : configuredBaseDeliveryFee) : 0;
        const total = subtotal + deliveryFee;

        res.json({
            success: true,
            data: {
                itemDetails,
                subtotal: parseFloat(subtotal.toFixed(2)),
                deliveryFee: parseFloat(deliveryFee.toFixed(2)),
                deliveryFeeNote: orderType === 'DELIVERY'
                    ? (isFreeByOrderValue
                        ? `Free delivery applied for orders above LKR ${freeDeliveryThreshold}. Final fee may still vary by distance constraints.`
                        : 'Base fee only. Actual fee calculated based on delivery distance.')
                    : null,
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
