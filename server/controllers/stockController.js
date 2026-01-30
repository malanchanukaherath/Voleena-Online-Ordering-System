const { DailyStock, StockMovement, MenuItem, sequelize } = require('../models');

// Get today's stock for all items
exports.getTodayStock = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const stocks = await DailyStock.findAll({
            where: { StockDate: today },
            include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: ['MenuItemID', 'Name', 'Price', 'CategoryID']
            }],
            order: [[{ model: MenuItem, as: 'menuItem' }, 'Name', 'ASC']]
        });

        res.json({
            success: true,
            data: stocks
        });

    } catch (error) {
        console.error('Get today stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock data'
        });
    }
};

// Set opening stock for an item
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
                message: 'Stock record already exists for this date'
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
            CreatedBy: staffId
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
            message: 'Failed to set opening stock'
        });
    }
};

// Adjust stock (add or remove)
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
                message: 'Stock record not found'
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
            CreatedBy: staffId
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
            message: 'Failed to adjust stock'
        });
    }
};

// Get stock movements (audit trail)
exports.getStockMovements = async (req, res) => {
    try {
        const { menuItemId, startDate, endDate, changeType } = req.query;
        const where = {};

        if (menuItemId) where.MenuItemID = menuItemId;
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
            data: movements
        });

    } catch (error) {
        console.error('Get stock movements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock movements'
        });
    }
};

// Bulk set opening stock for multiple items
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
                    CreatedBy: staffId
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
            message: 'Failed to set opening stock'
        });
    }
};
