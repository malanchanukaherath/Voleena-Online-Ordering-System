const { DailyStock, StockMovement, MenuItem, sequelize } = require('../models');
const stockService = require('../services/stockService');

/**
 * Stock Management Controller
 * Handles stock operations with role-based access:
 * - Admin: Full read/write access
 * - Kitchen: Read-only access with low-stock alerts
 */

/**
 * PART 3 & 2: Get today's stock for all items
 * Admin: Full details | Kitchen: Read-only with low-stock alerts
 */
exports.getTodayStock = async (req, res) => {
    try {
        const stocks = await stockService.getDailyStockWithAlerts();

        res.json({
            success: true,
            message: `Retrieved ${stocks.length} stock records for today`,
            data: stocks,
            lowStockCount: stocks.filter(s => s.IsLowStock).length
        });

    } catch (error) {
        console.error('Get today stock error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock data',
            message: error.message
        });
    }
};

/**
 * PART 2: Update opening quantity for a stock record (admin only)
 * 
 * Request body:
 * {
 *   "openingQuantity": 50  // New opening quantity
 * }
 */
exports.updateOpeningQuantity = async (req, res) => {
    try {
        const { stockId } = req.params;
        const { openingQuantity } = req.body;
        const staffId = req.user.id;

        // Validate input
        if (typeof openingQuantity !== 'number' || !Number.isInteger(openingQuantity)) {
            return res.status(400).json({
                success: false,
                error: 'Opening quantity must be an integer'
            });
        }

        const updatedStock = await stockService.updateOpeningQuantity(
            parseInt(stockId),
            openingQuantity,
            staffId
        );

        res.json({
            success: true,
            message: 'Opening quantity updated successfully',
            data: {
                StockID: updatedStock.StockID,
                MenuItemID: updatedStock.MenuItemID,
                StockDate: updatedStock.StockDate,
                OpeningQuantity: updatedStock.OpeningQuantity,
                SoldQuantity: updatedStock.SoldQuantity,
                AdjustedQuantity: updatedStock.AdjustedQuantity,
                ClosingQuantity: updatedStock.OpeningQuantity - updatedStock.SoldQuantity + updatedStock.AdjustedQuantity,
                LastUpdated: updatedStock.LastUpdated
            }
        });

    } catch (error) {
        console.error('Update opening quantity error:', error);

        if (error.status === 400) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update stock',
            message: error.message
        });
    }
};

/**
 * PART 2: Manual stock adjustment (admin only)
 * Use case: Damage, spoilage, inventory count correction
 * 
 * Request body:
 * {
 *   "adjustment": -5,  // Negative to reduce, positive to add
 *   "reason": "Damaged during delivery"
 * }
 */
exports.manualAdjustStock = async (req, res) => {
    try {
        const { stockId } = req.params;
        const { adjustment, reason } = req.body;
        const staffId = req.user.id;

        // Validate input
        if (typeof adjustment !== 'number' || !Number.isInteger(adjustment)) {
            return res.status(400).json({
                success: false,
                error: 'Adjustment quantity must be an integer'
            });
        }

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Reason for adjustment is required'
            });
        }

        if (reason.length > 255) {
            return res.status(400).json({
                success: false,
                error: 'Reason must be less than 255 characters'
            });
        }

        const updatedStock = await stockService.manualAdjustClosingQuantity(
            parseInt(stockId),
            adjustment,
            reason.trim(),
            staffId
        );

        res.json({
            success: true,
            message: 'Stock adjustment completed successfully',
            data: {
                StockID: updatedStock.StockID,
                MenuItemID: updatedStock.MenuItemID,
                StockDate: updatedStock.StockDate,
                OpeningQuantity: updatedStock.OpeningQuantity,
                SoldQuantity: updatedStock.SoldQuantity,
                AdjustedQuantity: updatedStock.AdjustedQuantity,
                ClosingQuantity: updatedStock.OpeningQuantity - updatedStock.SoldQuantity + updatedStock.AdjustedQuantity,
                Adjustment: adjustment,
                Reason: reason,
                LastUpdated: updatedStock.LastUpdated
            }
        });

    } catch (error) {
        console.error('Manual adjust stock error:', error);

        if (error.status === 400) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to adjust stock',
            message: error.message
        });
    }
};

/**
 * Delete a stock record (admin + kitchen only)
 * Only allowed if no sales have been recorded for the day
 */
exports.deleteStockRecord = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { stockId } = req.params;
        const staffId = req.user.id;

        const stock = await DailyStock.findByPk(stockId, { transaction });
        if (!stock) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Stock record not found'
            });
        }

        if (stock.SoldQuantity > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'Cannot remove stock record after sales have been recorded'
            });
        }

        await StockMovement.create({
            MenuItemID: stock.MenuItemID,
            StockDate: stock.StockDate,
            ChangeType: 'ADJUSTMENT',
            QuantityChange: -stock.OpeningQuantity,
            ReferenceType: 'MANUAL',
            Notes: 'Stock record removed',
            CreatedBy: staffId,
            CreatedAt: new Date()
        }, { transaction });

        await DailyStock.destroy({
            where: { StockID: stock.StockID },
            transaction
        });

        const today = new Date().toISOString().split('T')[0];
        if (stock.StockDate === today) {
            await MenuItem.update(
                { IsAvailable: false },
                { where: { MenuItemID: stock.MenuItemID }, transaction }
            );
        }

        await transaction.commit();

        res.json({
            success: true,
            message: 'Stock record removed successfully'
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Delete stock record error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove stock record',
            message: error.message
        });
    }
};

/**
 * PART 3: Get stock movements (audit trail)
 * Available to all staff roles
 */
exports.getStockMovements = async (req, res) => {
    try {
        const { menuItemId, startDate, endDate, changeType } = req.query;
        const where = {};

        if (menuItemId) where.MenuItemID = parseInt(menuItemId);
        if (changeType) where.ChangeType = changeType;
        if (startDate && endDate) {
            where.StockDate = {
                [sequelize.Op.between]: [startDate, endDate]
            };
        }

        const movements = await StockMovement.findAll({
            where,
            include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: ['MenuItemID', 'Name']
            }],
            order: [['CreatedAt', 'DESC']],
            limit: 100
        });

        res.json({
            success: true,
            message: `Retrieved ${movements.length} stock movements`,
            data: movements
        });

    } catch (error) {
        console.error('Get stock movements error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock movements',
            message: error.message
        });
    }
};

/**
 * LEGACY: Set opening stock for an item
 * Kept for backward compatibility, use updateOpeningQuantity instead
 */
exports.setOpeningStock = async (req, res) => {
    try {
        const { menuItemId, quantity, stockDate } = req.body;
        const staffId = req.user.id;

        const date = stockDate || new Date().toISOString().split('T')[0];

        // Check if stock record already exists
        const existingStock = await DailyStock.findOne({
            where: {
                MenuItemID: menuItemId,
                StockDate: date
            }
        });

        if (existingStock) {
            return res.status(400).json({
                success: false,
                error: 'Stock record already exists for this date'
            });
        }

        const stock = await DailyStock.create({
            MenuItemID: menuItemId,
            StockDate: date,
            OpeningQuantity: quantity,
            SoldQuantity: 0,
            AdjustedQuantity: 0,
            UpdatedBy: staffId
        });

        // Log stock movement
        await StockMovement.create({
            MenuItemID: menuItemId,
            StockDate: date,
            ChangeType: 'OPENING',
            QuantityChange: quantity,
            ReferenceType: 'MANUAL',
            Notes: 'Opening stock set',
            CreatedBy: staffId,
            CreatedAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Opening stock set successfully',
            data: stock
        });

    } catch (error) {
        console.error('Set opening stock error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set opening stock',
            message: error.message
        });
    }
};

/**
 * LEGACY: Adjust stock (add or remove)
 * Kept for backward compatibility, use manualAdjustStock instead
 */
exports.adjustStock = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { adjustment, reason } = req.body;
        const staffId = req.user.id;

        const stock = await DailyStock.findByPk(id, { transaction });
        if (!stock) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Stock record not found'
            });
        }

        stock.AdjustedQuantity += adjustment;
        stock.UpdatedBy = staffId;
        await stock.save({ transaction });

        // Log stock movement
        await StockMovement.create({
            MenuItemID: stock.MenuItemID,
            StockDate: stock.StockDate,
            ChangeType: 'ADJUSTMENT',
            QuantityChange: adjustment,
            ReferenceType: 'MANUAL',
            Notes: reason || 'Stock adjustment',
            CreatedBy: staffId,
            CreatedAt: new Date()
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Stock adjusted successfully',
            data: stock
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Adjust stock error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to adjust stock',
            message: error.message
        });
    }
};

/**
 * LEGACY: Bulk set opening stock for multiple items
 */
exports.bulkSetOpeningStock = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { items, stockDate } = req.body;
        const staffId = req.user.id;
        const date = stockDate || new Date().toISOString().split('T')[0];

        const results = [];

        for (const item of items) {
            const existingStock = await DailyStock.findOne({
                where: {
                    MenuItemID: item.menuItemId,
                    StockDate: date
                },
                transaction
            });

            if (!existingStock) {
                const stock = await DailyStock.create({
                    MenuItemID: item.menuItemId,
                    StockDate: date,
                    OpeningQuantity: item.quantity,
                    SoldQuantity: 0,
                    AdjustedQuantity: 0,
                    UpdatedBy: staffId
                }, { transaction });

                await StockMovement.create({
                    MenuItemID: item.menuItemId,
                    StockDate: date,
                    ChangeType: 'OPENING',
                    QuantityChange: item.quantity,
                    ReferenceType: 'MANUAL',
                    Notes: 'Bulk opening stock set',
                    CreatedBy: staffId,
                    CreatedAt: new Date()
                }, { transaction });

                results.push(stock);
            }
        }

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: `Opening stock set for ${results.length} items`,
            data: results
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Bulk set opening stock error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set opening stock',
            message: error.message
        });
    }
};
