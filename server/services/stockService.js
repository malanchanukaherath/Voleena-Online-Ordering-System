const { DailyStock, StockMovement, MenuItem, sequelize } = require('../models');
const { Transaction, Op } = require('sequelize');

/**
 * Stock Management Service with Race Condition Protection
 * Implements FR22, FR24, FR25 with atomic operations
 */
class StockService {
    /**
     * Validate and reserve stock atomically (FR22, FR24)
     * Uses SERIALIZABLE isolation and SELECT FOR UPDATE
     */
    async validateAndReserveStock(items, stockDate, transaction) {
        const reservations = [];

        for (const item of items) {
            const { menu_item_id, quantity } = item;

            // Lock the stock row for update
            const stock = await DailyStock.findOne({
                where: {
                    menu_item_id,
                    stock_date: stockDate
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                throw new Error(`No stock record found for menu item ${menu_item_id} on ${stockDate}`);
            }

            // Calculate available quantity
            const availableQty = stock.opening_quantity - stock.sold_quantity + stock.adjusted_quantity;

            if (availableQty < quantity) {
                const menuItem = await MenuItem.findByPk(menu_item_id);
                throw new Error(
                    `Insufficient stock for ${menuItem.name}. Available: ${availableQty}, Requested: ${quantity}`
                );
            }

            // Optimistic locking check
            const currentVersion = stock.version;

            // Update sold quantity and version
            const [updatedRows] = await DailyStock.update(
                {
                    sold_quantity: stock.sold_quantity + quantity,
                    version: currentVersion + 1,
                    updated_by: null // Set from context if available
                },
                {
                    where: {
                        stock_id: stock.stock_id,
                        version: currentVersion // Ensure version hasn't changed
                    },
                    transaction
                }
            );

            if (updatedRows === 0) {
                throw new Error('Stock was modified by another transaction. Please retry.');
            }

            reservations.push({
                menu_item_id,
                quantity,
                stock_id: stock.stock_id
            });
        }

        return reservations;
    }

    /**
     * Deduct stock and log movement (FR22)
     */
    async deductStock(orderId, items, stockDate, staffId, transaction) {
        for (const item of items) {
            const { menu_item_id, quantity } = item;

            // Log stock movement
            await StockMovement.create({
                menu_item_id,
                stock_date: stockDate,
                change_type: 'SALE',
                quantity_change: -quantity,
                reference_id: orderId,
                reference_type: 'ORDER',
                notes: `Order #${orderId}`,
                created_by: staffId
            }, { transaction });
        }
    }

    /**
     * Return stock (for cancelled orders) (FR21)
     */
    async returnStock(orderId, items, stockDate, staffId, transaction) {
        for (const item of items) {
            const { menu_item_id, quantity } = item;

            // Lock the stock row
            const stock = await DailyStock.findOne({
                where: {
                    menu_item_id,
                    stock_date: stockDate
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                throw new Error(`No stock record found for menu item ${menu_item_id}`);
            }

            // Return quantity
            const currentVersion = stock.version;

            const [updatedRows] = await DailyStock.update({
                sold_quantity: Math.max(0, stock.sold_quantity - quantity),
                version: currentVersion + 1,
                updated_by: staffId
            }, {
                where: {
                    stock_id: stock.stock_id,
                    version: currentVersion
                },
                transaction
            });

            if (updatedRows === 0) {
                throw new Error('Stock was modified by another transaction. Please retry.');
            }

            // Log stock movement
            await StockMovement.create({
                menu_item_id,
                stock_date: stockDate,
                change_type: 'RETURN',
                quantity_change: quantity,
                reference_id: orderId,
                reference_type: 'ORDER',
                notes: `Order #${orderId} cancelled - stock returned`,
                created_by: staffId
            }, { transaction });
        }
    }

    /**
     * Set opening stock for a date (FR24)
     */
    async setOpeningStock(menuItemId, stockDate, openingQuantity, staffId) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const [stock, created] = await DailyStock.findOrCreate({
                where: {
                    menu_item_id: menuItemId,
                    stock_date: stockDate
                },
                defaults: {
                    opening_quantity: openingQuantity,
                    sold_quantity: 0,
                    adjusted_quantity: 0,
                    updated_by: staffId
                },
                transaction
            });

            if (!created) {
                // Update existing stock
                await stock.update({
                    opening_quantity: openingQuantity,
                    updated_by: staffId,
                    version: stock.version + 1
                }, { transaction });
            }

            // Log stock movement
            await StockMovement.create({
                menu_item_id: menuItemId,
                stock_date: stockDate,
                change_type: 'OPENING',
                quantity_change: openingQuantity,
                reference_type: 'MANUAL',
                notes: 'Opening stock set',
                created_by: staffId
            }, { transaction });

            await transaction.commit();
            return stock;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Adjust stock (FR24)
     */
    async adjustStock(menuItemId, stockDate, adjustmentQuantity, reason, staffId) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const stock = await DailyStock.findOne({
                where: {
                    menu_item_id: menuItemId,
                    stock_date: stockDate
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                throw new Error('Stock record not found');
            }

            const currentVersion = stock.version;

            const [updatedRows] = await DailyStock.update({
                adjusted_quantity: stock.adjusted_quantity + adjustmentQuantity,
                version: currentVersion + 1,
                updated_by: staffId
            }, {
                where: {
                    stock_id: stock.stock_id,
                    version: currentVersion
                },
                transaction
            });

            if (updatedRows === 0) {
                throw new Error('Stock was modified by another transaction. Please retry.');
            }

            // Log stock movement
            await StockMovement.create({
                menu_item_id: menuItemId,
                stock_date: stockDate,
                change_type: 'ADJUSTMENT',
                quantity_change: adjustmentQuantity,
                reference_type: 'MANUAL',
                notes: reason,
                created_by: staffId
            }, { transaction });

            await transaction.commit();

            return await DailyStock.findByPk(stock.stock_id);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get current stock for menu item
     */
    async getCurrentStock(menuItemId, stockDate = new Date()) {
        const dateStr = stockDate.toISOString().split('T')[0];

        const stock = await DailyStock.findOne({
            where: {
                menu_item_id: menuItemId,
                stock_date: dateStr
            },
            include: [{
                model: MenuItem,
                as: 'menuItem'
            }]
        });

        if (!stock) {
            return {
                menu_item_id: menuItemId,
                stock_date: dateStr,
                opening_quantity: 0,
                sold_quantity: 0,
                adjusted_quantity: 0,
                closing_quantity: 0
            };
        }

        return stock;
    }

    /**
     * Get stock movements for a menu item
     */
    async getStockMovements(menuItemId, startDate, endDate) {
        return await StockMovement.findAll({
            where: {
                menu_item_id: menuItemId,
                stock_date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['created_at', 'DESC']],
            include: [{
                model: MenuItem,
                as: 'menuItem'
            }]
        });
    }

    /**
     * Auto-disable menu items with zero stock (FR25)
     * This is also handled by database trigger
     */
    async autoDisableOutOfStockItems(stockDate = new Date()) {
        const dateStr = stockDate.toISOString().split('T')[0];

        // Find items with zero closing quantity
        const outOfStockItems = await DailyStock.findAll({
            where: {
                stock_date: dateStr,
                closing_quantity: 0
            }
        });

        const menuItemIds = outOfStockItems.map(s => s.menu_item_id);

        if (menuItemIds.length > 0) {
            await MenuItem.update(
                { is_available: false },
                { where: { menu_item_id: menuItemIds } }
            );
        }

        return menuItemIds;
    }
}

module.exports = new StockService();
