const { DailyStock, StockMovement, MenuItem, sequelize } = require('../models');
const { Transaction, Op } = require('sequelize');

/**
 * Stock Management Service with Race Condition Protection
 * Implements FR22, FR24, FR25, and daily auto-creation
 * 
 * Key Features:
 * - Daily stock record auto-generation at 12:00 AM
 * - Transaction-safe stock updates with SERIALIZABLE isolation
 * - Low-stock alerts (closing_quantity <= 5)
 * - Row-level locking with SELECT FOR UPDATE
 * - Comprehensive audit trail via stock_movement table
 */
class StockService {
    async syncMenuItemAvailability(menuItemId, closingQuantity, transaction = null) {
        await MenuItem.update(
            { IsAvailable: closingQuantity > 0 },
            {
                where: { MenuItemID: menuItemId },
                ...(transaction ? { transaction } : {})
            }
        );
    }

    /**
     * Validate and reserve stock atomically (FR22, FR24)
     * Uses SERIALIZABLE isolation and SELECT FOR UPDATE
     */
    async validateAndReserveStock(items, stockDate, transaction) {
        const reservations = [];

        for (const item of items) {
            const menuItemId = item.MenuItemID ?? item.menu_item_id;
            const quantity = item.Quantity ?? item.quantity;

            // Lock the stock row for update
            const stock = await DailyStock.findOne({
                where: {
                    MenuItemID: menuItemId,
                    StockDate: stockDate
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                throw new Error(`No stock record found for menu item ${menuItemId} on ${stockDate}`);
            }

            // Calculate available quantity
            const availableQty = stock.OpeningQuantity - stock.SoldQuantity + stock.AdjustedQuantity;

            if (availableQty < quantity) {
                const menuItem = await MenuItem.findByPk(menuItemId);
                throw new Error(
                    `Insufficient stock for ${menuItem?.Name ?? 'menu item'}. Available: ${availableQty}, Requested: ${quantity}`
                );
            }

            // Optimistic locking check
            const currentVersion = stock.Version;

            // Update sold quantity and version
            const [updatedRows] = await DailyStock.update(
                {
                    SoldQuantity: stock.SoldQuantity + quantity,
                    Version: currentVersion + 1,
                    UpdatedBy: null // Set from context if available
                },
                {
                    where: {
                        StockID: stock.StockID,
                        Version: currentVersion // Ensure version hasn't changed
                    },
                    transaction
                }
            );

            if (updatedRows === 0) {
                throw new Error('Stock was modified by another transaction. Please retry.');
            }

            reservations.push({
                MenuItemID: menuItemId,
                Quantity: quantity,
                StockID: stock.StockID
            });
        }

        return reservations;
    }

    /**
     * Deduct stock and log movement (FR22)
     */
    async deductStock(orderId, items, stockDate, staffId, transaction) {
        for (const item of items) {
            const menuItemId = item.MenuItemID ?? item.menu_item_id;
            const quantity = item.Quantity ?? item.quantity;

            // Log stock movement
            await StockMovement.create({
                MenuItemID: menuItemId,
                StockDate: stockDate,
                ChangeType: 'SALE',
                QuantityChange: -quantity,
                ReferenceID: orderId,
                ReferenceType: 'ORDER',
                Notes: `Order #${orderId}`,
                CreatedBy: staffId,
                CreatedAt: new Date()
            }, { transaction });
        }
    }

    /**
     * Return stock (for cancelled orders) (FR21)
     */
    async returnStock(orderId, items, stockDate, staffId, transaction) {
        for (const item of items) {
            const menuItemId = item.MenuItemID ?? item.menu_item_id;
            const quantity = item.Quantity ?? item.quantity;

            // Lock the stock row
            const stock = await DailyStock.findOne({
                where: {
                    MenuItemID: menuItemId,
                    StockDate: stockDate
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                throw new Error(`No stock record found for menu item ${menuItemId}`);
            }

            // Return quantity
            const currentVersion = stock.Version;

            const [updatedRows] = await DailyStock.update({
                SoldQuantity: Math.max(0, stock.SoldQuantity - quantity),
                Version: currentVersion + 1,
                UpdatedBy: staffId
            }, {
                where: {
                    StockID: stock.StockID,
                    Version: currentVersion
                },
                transaction
            });

            if (updatedRows === 0) {
                throw new Error('Stock was modified by another transaction. Please retry.');
            }

            // Log stock movement
            await StockMovement.create({
                MenuItemID: menuItemId,
                StockDate: stockDate,
                ChangeType: 'RETURN',
                QuantityChange: quantity,
                ReferenceID: orderId,
                ReferenceType: 'ORDER',
                Notes: `Order #${orderId} cancelled - stock returned`,
                CreatedBy: staffId,
                CreatedAt: new Date()
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
                    MenuItemID: menuItemId,
                    StockDate: stockDate
                },
                defaults: {
                    OpeningQuantity: openingQuantity,
                    SoldQuantity: 0,
                    AdjustedQuantity: 0,
                    UpdatedBy: staffId
                },
                transaction
            });

            if (!created) {
                // Update existing stock
                await stock.update({
                    OpeningQuantity: openingQuantity,
                    UpdatedBy: staffId,
                    Version: stock.Version + 1
                }, { transaction });
            }

            // Log stock movement
            await StockMovement.create({
                MenuItemID: menuItemId,
                StockDate: stockDate,
                ChangeType: 'OPENING',
                QuantityChange: openingQuantity,
                ReferenceType: 'MANUAL',
                Notes: 'Opening stock set',
                CreatedBy: staffId,
                CreatedAt: new Date()
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
                    MenuItemID: menuItemId,
                    StockDate: stockDate
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                throw new Error('Stock record not found');
            }

            const currentVersion = stock.Version;

            const [updatedRows] = await DailyStock.update({
                AdjustedQuantity: stock.AdjustedQuantity + adjustmentQuantity,
                Version: currentVersion + 1,
                UpdatedBy: staffId
            }, {
                where: {
                    StockID: stock.StockID,
                    Version: currentVersion
                },
                transaction
            });

            if (updatedRows === 0) {
                throw new Error('Stock was modified by another transaction. Please retry.');
            }

            // Log stock movement
            await StockMovement.create({
                MenuItemID: menuItemId,
                StockDate: stockDate,
                ChangeType: 'ADJUSTMENT',
                QuantityChange: adjustmentQuantity,
                ReferenceType: 'MANUAL',
                Notes: reason,
                CreatedBy: staffId,
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            return await DailyStock.findByPk(stock.StockID);
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
                MenuItemID: menuItemId,
                StockDate: dateStr
            },
            include: [{
                model: MenuItem,
                as: 'menuItem'
            }]
        });

        if (!stock) {
            return {
                MenuItemID: menuItemId,
                StockDate: dateStr,
                OpeningQuantity: 0,
                SoldQuantity: 0,
                AdjustedQuantity: 0,
                ClosingQuantity: 0
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
                MenuItemID: menuItemId,
                StockDate: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['CreatedAt', 'DESC']],
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
        // Handle both Date objects and date strings (YYYY-MM-DD)
        let dateStr = stockDate;
        if (stockDate instanceof Date) {
            dateStr = stockDate.toISOString().split('T')[0];
        } else if (typeof stockDate === 'string') {
            // Already a date string, use as-is
            dateStr = stockDate;
        }

        // Find items with zero closing quantity
        const outOfStockItems = await DailyStock.findAll({
            where: {
                StockDate: dateStr,
                ClosingQuantity: 0
            },
            attributes: ['MenuItemID']
        });

        const inStockItems = await DailyStock.findAll({
            where: {
                StockDate: dateStr,
                ClosingQuantity: {
                    [Op.gt]: 0
                }
            },
            attributes: ['MenuItemID']
        });

        const menuItemIds = outOfStockItems.map(s => s.MenuItemID);
        const inStockMenuItemIds = inStockItems.map(s => s.MenuItemID);

        if (menuItemIds.length > 0) {
            await MenuItem.update(
                { IsAvailable: false },
                { where: { MenuItemID: menuItemIds } }
            );
        }

        if (inStockMenuItemIds.length > 0) {
            await MenuItem.update(
                { IsAvailable: true },
                { where: { MenuItemID: inStockMenuItemIds } }
            );
        }

        return menuItemIds;
    }

    /**
     * PART 1: Create daily stock records for all active menu items
     * Runs at 12:00 AM (configured via node-cron in automatedJobs.js)
     * 
     * Algorithm:
     * 1. Get all active menu items
     * 2. For each item, check if stock record exists for tomorrow
     * 3. If not, get yesterday's closing quantity as opening quantity
     * 4. Create new stock record with opening qty, sold=0, adjusted=0
     * 5. Prevent duplicates with UNIQUE (MenuItemID, StockDate) constraint
     * 6. Use transactions for atomicity
     * 
     * @param {Date} targetDate - Date for which to create stock records (default: tomorrow)
     * @returns {Promise<Object>} {created: count, failed: count, errors: []}
     */
    async createDailyStockRecords(targetDate = null) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            // Use tomorrow by default
            const date = targetDate ? new Date(targetDate) : new Date();
            date.setDate(date.getDate() + 1); // Tomorrow
            const dateStr = date.toISOString().split('T')[0];
            const yesterdayStr = new Date(date.getTime() - 86400000).toISOString().split('T')[0];

            // Get all active menu items
            const activeMenuItems = await MenuItem.findAll({
                where: { IsActive: true },
                attributes: ['MenuItemID'],
                raw: true
            });

            const results = { created: 0, failed: 0, errors: [], skipped: 0 };

            for (const item of activeMenuItems) {
                try {
                    const menuItemId = item.MenuItemID;

                    // Check if stock record already exists for this date
                    const existingStock = await DailyStock.findOne({
                        where: {
                            MenuItemID: menuItemId,
                            StockDate: dateStr
                        },
                        transaction
                    });

                    if (existingStock) {
                        results.skipped++;
                        continue;
                    }

                    // Get yesterday's closing quantity as opening quantity
                    const yesterdayStock = await DailyStock.findOne({
                        where: {
                            MenuItemID: menuItemId,
                            StockDate: yesterdayStr
                        },
                        transaction
                    });

                    const openingQty = yesterdayStock
                        ? (yesterdayStock.OpeningQuantity - yesterdayStock.SoldQuantity + yesterdayStock.AdjustedQuantity)
                        : 0;

                    // Validate quantity is non-negative
                    if (openingQty < 0) {
                        results.errors.push({
                            menuItemId,
                            error: `Negative opening quantity would be ${openingQty}. Setting to 0.`
                        });
                    }

                    // Create new stock record
                    await DailyStock.create({
                        MenuItemID: menuItemId,
                        StockDate: dateStr,
                        OpeningQuantity: Math.max(0, openingQty),
                        SoldQuantity: 0,
                        AdjustedQuantity: 0,
                        UpdatedBy: null // System-generated, no user context
                    }, { transaction });

                    results.created++;
                } catch (itemError) {
                    results.failed++;
                    results.errors.push({
                        menuItemId: item.MenuItemID,
                        error: itemError.message
                    });
                }
            }

            await transaction.commit();

            console.log(`✅ Daily stock creation for ${dateStr}: Created=${results.created}, Skipped=${results.skipped}, Failed=${results.failed}`);
            return results;
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Daily stock creation failed:', error.message);
            throw new Error(`Stock creation failed: ${error.message}`);
        }
    }

    /**
     * PART 5: Get daily stock with low-stock alerts
     * Flags items where closing_quantity <= 5
     * 
     * @param {string} stockDate - Date in YYYY-MM-DD format (default: today)
     * @returns {Promise<Array>} Array of stock records with isLowStock flag
     */
    async getDailyStockWithAlerts(stockDate = null) {
        const dateStr = stockDate || new Date().toISOString().split('T')[0];
        const LOW_STOCK_THRESHOLD = 5; // qty <= 5 triggers alert

        const stocks = await DailyStock.findAll({
            where: { StockDate: dateStr },
            include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: ['MenuItemID', 'Name', 'Price', 'IsActive', 'IsAvailable']
            }],
            order: [[{ model: MenuItem, as: 'menuItem' }, 'Name', 'ASC']]
        });

        // Add low-stock flag and format response
        return stocks.map(stock => {
            const closingQty = stock.OpeningQuantity - stock.SoldQuantity + stock.AdjustedQuantity;
            const isLowStock = closingQty <= LOW_STOCK_THRESHOLD;

            if (isLowStock) {
                console.warn(`⚠️  LOW STOCK ALERT: ${stock.menuItem?.Name} (Qty: ${closingQty})`);
            }

            return {
                StockID: stock.StockID,
                MenuItemID: stock.MenuItemID,
                StockDate: stock.StockDate,
                OpeningQuantity: stock.OpeningQuantity,
                SoldQuantity: stock.SoldQuantity,
                AdjustedQuantity: stock.AdjustedQuantity,
                ClosingQuantity: closingQty,
                IsLowStock: isLowStock,
                menuItem: stock.menuItem,
                LastUpdated: stock.LastUpdated
            };
        });
    }

    /**
     * PART 2: Validate stock quantities are non-negative
     * @param {string} stockId - Stock ID
     * @param {number} openingQty - Opening quantity
     * @returns {Promise<Object>} {isValid, errors: []}
     */
    async validateStockQuantities(stockId, openingQty) {
        const errors = [];

        if (typeof openingQty !== 'number' || !Number.isInteger(openingQty)) {
            errors.push('Opening quantity must be an integer');
        }

        if (openingQty < 0) {
            errors.push('Opening quantity cannot be negative');
        }

        if (openingQty > 10000) {
            errors.push('Opening quantity exceeds maximum (10000)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * PART 2: Update opening quantity (admin only)
     * Uses SERIALIZABLE transaction + SELECT FOR UPDATE
     * 
     * @param {number} stockId - Stock ID
     * @param {number} newOpeningQuantity - New opening quantity
     * @param {number} staffId - Staff ID making the change
     * @returns {Promise<Object>} Updated stock record
     */
    async updateOpeningQuantity(stockId, newOpeningQuantity, staffId) {
        // Validate input
        const validation = await this.validateStockQuantities(stockId, newOpeningQuantity);
        if (!validation.isValid) {
            const error = new Error(validation.errors.join('; '));
            error.status = 400;
            throw error;
        }

        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            // Lock the stock row
            const stock = await DailyStock.findByPk(stockId, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                const error = new Error('Stock record not found');
                error.status = 404;
                throw error;
            }

            const oldOpeningQty = stock.OpeningQuantity;

            // Update opening quantity
            await stock.update(
                {
                    OpeningQuantity: newOpeningQuantity,
                    UpdatedBy: staffId
                },
                { transaction }
            );

            const closingQty = newOpeningQuantity - stock.SoldQuantity + stock.AdjustedQuantity;
            await this.syncMenuItemAvailability(stock.MenuItemID, closingQty, transaction);

            // Log the change as a stock movement
            const difference = newOpeningQuantity - oldOpeningQty;
            await StockMovement.create({
                MenuItemID: stock.MenuItemID,
                StockDate: stock.StockDate,
                ChangeType: 'ADJUSTMENT',
                QuantityChange: difference,
                ReferenceType: 'MANUAL',
                Notes: `Opening quantity changed from ${oldOpeningQty} to ${newOpeningQuantity} by admin`,
                CreatedBy: staffId,
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            console.log(`✅ Opening quantity updated: Stock ID ${stockId}, Old=${oldOpeningQty}, New=${newOpeningQuantity}`);
            return stock.reload();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * PART 2: Manual adjustment to closing quantity (admin only)
     * Use case: Damage, spoilage, inventory count correction
     * 
     * @param {number} stockId - Stock ID
     * @param {number} adjustmentQuantity - Amount to adjust (can be negative)
     * @param {string} reason - Reason for adjustment
     * @param {number} staffId - Staff ID making the change
     * @returns {Promise<Object>} Updated stock record
     */
    async manualAdjustClosingQuantity(stockId, adjustmentQuantity, reason, staffId) {
        // Validate adjustment quantity
        if (typeof adjustmentQuantity !== 'number' || !Number.isInteger(adjustmentQuantity)) {
            const error = new Error('Adjustment quantity must be an integer');
            error.status = 400;
            throw error;
        }

        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            // Lock the stock row
            const stock = await DailyStock.findByPk(stockId, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!stock) {
                const error = new Error('Stock record not found');
                error.status = 404;
                throw error;
            }

            const oldAdjustment = stock.AdjustedQuantity;
            const newAdjustment = oldAdjustment + adjustmentQuantity;
            const closingQtyBefore = stock.OpeningQuantity - stock.SoldQuantity + oldAdjustment;
            const closingQtyAfter = stock.OpeningQuantity - stock.SoldQuantity + newAdjustment;

            // Prevent closing quantity from going negative
            if (closingQtyAfter < 0) {
                const error = new Error(`Adjustment would result in negative closing quantity (${closingQtyAfter}). Max adjustment: ${-oldAdjustment}`);
                error.status = 400;
                throw error;
            }

            // Update adjusted quantity
            await stock.update(
                {
                    AdjustedQuantity: newAdjustment,
                    UpdatedBy: staffId
                },
                { transaction }
            );

            await this.syncMenuItemAvailability(stock.MenuItemID, closingQtyAfter, transaction);

            // Log the adjustment
            await StockMovement.create({
                MenuItemID: stock.MenuItemID,
                StockDate: stock.StockDate,
                ChangeType: 'ADJUSTMENT',
                QuantityChange: adjustmentQuantity,
                ReferenceType: 'MANUAL',
                Notes: `Manual adjustment: ${reason} (Qty: ${closingQtyBefore} → ${closingQtyAfter})`,
                CreatedBy: staffId,
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            console.log(`✅ Manual adjustment: Stock ID ${stockId}, Adjustment=${adjustmentQuantity}, Reason=${reason}`);
            return stock.reload();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new StockService();
