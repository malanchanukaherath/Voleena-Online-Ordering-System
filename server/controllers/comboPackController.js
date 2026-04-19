// CODEMAP: BACKEND_CONTROLLER_COMBOPACKCONTROLLER
// PURPOSE: Handles incoming requests, processes logic, and returns responses.
// SEARCH_HINT: Look here for request handling logic and data processing.
const { ComboPack, ComboPackItem, MenuItem } = require('../models');
const { Op, literal } = require('sequelize');
const db = require('../models');
const { uploadImageFile, deleteImageByUrl } = require('../services/uploadService');

// Simple: This handles to money number logic.
const toMoneyNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

// Simple: This handles enrich combo pricing logic.
const enrichComboPricing = (comboData) => {
    const items = Array.isArray(comboData.items) ? comboData.items : [];
    const originalPrice = items.reduce((sum, item) => {
        const itemPrice = toMoneyNumber(item?.menuItem?.Price);
        const quantity = toMoneyNumber(item?.Quantity);
        return sum + (itemPrice * quantity);
    }, 0);

    const comboPrice = toMoneyNumber(comboData.Price);
    const discount = Math.max(originalPrice - comboPrice, 0);
    const discountPercentage = originalPrice > 0
        ? Number.parseFloat(((discount / originalPrice) * 100).toFixed(2))
        : 0;

    return {
        ...comboData,
        OriginalPrice: Number.parseFloat(originalPrice.toFixed(2)),
        Discount: Number.parseFloat(discount.toFixed(2)),
        DiscountPercentage: discountPercentage
    };
};

// Simple: This creates the combo pack.
const createComboPack = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { Name, Description, Price, ScheduleStartDate, ScheduleEndDate, IsActive, items, ImageURL } = req.body;

        if (!Name || Name.trim().length < 3) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Name must be at least 3 characters' });
        }

        if (!Price || parseFloat(Price) <= 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        if (!ScheduleStartDate || !ScheduleEndDate) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Schedule dates are required' });
        }

        if (new Date(ScheduleEndDate) < new Date(ScheduleStartDate)) {
            await transaction.rollback();
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        if (!items || items.length < 2) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Combo must include at least 2 items' });
        }

        for (const item of items) {
            const menuItem = await MenuItem.findByPk(item.MenuItemID);
            if (!menuItem) {
                await transaction.rollback();
                return res.status(404).json({ error: `Menu item ${item.MenuItemID} not found` });
            }
            if (!item.Quantity || item.Quantity < 1) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Item quantity must be at least 1' });
            }
        }

        const comboPack = await ComboPack.create({
            Name: Name.trim(),
            Description: Description ? Description.trim() : null,
            Price: parseFloat(Price),
            ImageURL: ImageURL || null,
            ScheduleStartDate,
            ScheduleEndDate,
            IsActive: IsActive !== undefined ? IsActive : true,
            CreatedBy: req.user.id
        }, { transaction });

        for (const item of items) {
            await ComboPackItem.create({
                ComboID: comboPack.ComboID,
                MenuItemID: item.MenuItemID,
                Quantity: item.Quantity
            }, { transaction });
        }

        await transaction.commit();

        const createdCombo = await ComboPack.findByPk(comboPack.ComboID, {
            include: [{
                model: ComboPackItem,
                as: 'items',
                include: [{
                    model: MenuItem,
                    as: 'menuItem'
                }]
            }]
        });

        res.status(201).json({
            success: true,
            data: createdCombo
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Create combo pack error:', error);
        res.status(500).json({ error: 'Failed to create combo pack' });
    }
};

// Simple: This gets the all combo packs.
const getAllComboPacks = async (req, res) => {
    try {
        const { isActive } = req.query;

        const where = {};
        if (isActive !== undefined) {
            where.IsActive = isActive === 'true';
        }

        const comboPacks = await ComboPack.findAll({
            where,
            include: [{
                model: ComboPackItem,
                as: 'items',
                include: [{
                    model: MenuItem,
                    as: 'menuItem',
                    attributes: ['MenuItemID', 'Name', 'Price']
                }]
            }],
            order: [[literal('`ComboPack`.`created_at`'), 'DESC']]
        });

        const enrichedCombos = comboPacks.map((combo) => enrichComboPricing(combo.toJSON()));

        res.json({
            success: true,
            data: enrichedCombos
        });
    } catch (error) {
        console.error('Get combo packs error:', error);
        res.status(500).json({ error: 'Failed to fetch combo packs' });
    }
};

// Simple: This gets the active combo packs.
const getActiveComboPacks = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const comboPacks = await ComboPack.findAll({
            where: {
                IsActive: true,
                ScheduleStartDate: { [Op.lte]: today },
                ScheduleEndDate: { [Op.gte]: today }
            },
            include: [{
                model: ComboPackItem,
                as: 'items',
                include: [{
                    model: MenuItem,
                    as: 'menuItem',
                    attributes: ['MenuItemID', 'Name', 'Price', 'ImageURL']
                }]
            }],
            order: [[literal('`ComboPack`.`created_at`'), 'DESC']]
        });

        const enrichedCombos = comboPacks.map((combo) => enrichComboPricing(combo.toJSON()));

        res.json({
            success: true,
            data: enrichedCombos
        });
    } catch (error) {
        console.error('Get active combo packs error:', error);
        res.status(500).json({ error: 'Failed to fetch active combo packs' });
    }
};

// Simple: This gets the combo pack.
const getComboPack = async (req, res) => {
    try {
        const { id } = req.params;

        const comboPack = await ComboPack.findByPk(id, {
            include: [{
                model: ComboPackItem,
                as: 'items',
                include: [{
                    model: MenuItem,
                    as: 'menuItem'
                }]
            }]
        });

        if (!comboPack) {
            return res.status(404).json({ error: 'Combo pack not found' });
        }

        res.json({
            success: true,
            data: enrichComboPricing(comboPack.toJSON())
        });
    } catch (error) {
        console.error('Get combo pack error:', error);
        res.status(500).json({ error: 'Failed to fetch combo pack' });
    }
};

// Simple: This updates the combo pack.
const updateComboPack = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { Name, Description, Price, ScheduleStartDate, ScheduleEndDate, IsActive, items, ImageURL } = req.body;

        const comboPack = await ComboPack.findByPk(id);
        if (!comboPack) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Combo pack not found' });
        }

        const previousImageUrl = comboPack.ImageURL || null;

        if (Name && Name.trim().length < 3) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Name must be at least 3 characters' });
        }

        if (Price && parseFloat(Price) <= 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        if (ScheduleStartDate && ScheduleEndDate && new Date(ScheduleEndDate) < new Date(ScheduleStartDate)) {
            await transaction.rollback();
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        const updateData = {};
        if (Name) updateData.Name = Name.trim();
        if (Description !== undefined) updateData.Description = Description ? Description.trim() : null;
        if (Price) updateData.Price = parseFloat(Price);
        if (ImageURL !== undefined) updateData.ImageURL = ImageURL || null;
        if (ScheduleStartDate) updateData.ScheduleStartDate = ScheduleStartDate;
        if (ScheduleEndDate) updateData.ScheduleEndDate = ScheduleEndDate;
        if (IsActive !== undefined) updateData.IsActive = IsActive;
        updateData.UpdatedAt = new Date();

        await comboPack.update(updateData, { transaction });

        if (items) {
            if (items.length < 2) {
                await transaction.rollback();
                return res.status(400).json({ error: 'Combo must include at least 2 items' });
            }

            await ComboPackItem.destroy({
                where: { ComboID: id },
                transaction
            });

            for (const item of items) {
                const menuItem = await MenuItem.findByPk(item.MenuItemID);
                if (!menuItem) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: `Menu item with ID ${item.MenuItemID} not found`
                    });
                }
                if (!menuItem.IsActive) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: `Menu item ${menuItem.Name} is not active`
                    });
                }
                await ComboPackItem.create({
                    ComboID: id,
                    MenuItemID: item.MenuItemID,
                    Quantity: item.Quantity
                }, { transaction });
            }
        }

        await transaction.commit();

        if (ImageURL !== undefined) {
            const nextImageUrl = ImageURL || null;
            if (previousImageUrl && previousImageUrl !== nextImageUrl) {
                try {
                    await deleteImageByUrl(previousImageUrl);
                } catch (cleanupError) {
                    console.warn('Combo old image cleanup failed:', cleanupError.message);
                }
            }
        }

        const updatedCombo = await ComboPack.findByPk(id, {
            include: [{
                model: ComboPackItem,
                as: 'items',
                include: [{
                    model: MenuItem,
                    as: 'menuItem'
                }]
            }]
        });

        res.json({
            success: true,
            data: updatedCombo
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Update combo pack error:', error);
        res.status(500).json({ error: 'Failed to update combo pack' });
    }
};

// Simple: This removes or clears the combo pack.
const deleteComboPack = async (req, res) => {
    try {
        const { id } = req.params;

        const comboPack = await ComboPack.findByPk(id);
        if (!comboPack) {
            return res.status(404).json({
                success: false,
                message: 'Combo pack not found'
            });
        }

        comboPack.IsActive = !comboPack.IsActive;
        await comboPack.save();

        res.json({
            success: true,
            message: `Combo pack ${comboPack.IsActive ? 'activated' : 'deactivated'} successfully`,
            data: comboPack
        });
    } catch (error) {
        console.error('Delete combo pack error:', error);
        res.status(500).json({ error: 'Failed to delete combo pack' });
    }
};

// Simple: This handles upload image logic.
const uploadImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const comboPack = await ComboPack.findByPk(id);
        if (!comboPack) {
            return res.status(404).json({ error: 'Combo pack not found' });
        }

        const previousImageUrl = comboPack.ImageURL || null;

        const { secureUrl } = await uploadImageFile(req.file, 'combo');
        const imageUrl = secureUrl;
        await comboPack.update({ ImageURL: imageUrl });

        if (previousImageUrl && previousImageUrl !== imageUrl) {
            try {
                await deleteImageByUrl(previousImageUrl);
            } catch (cleanupError) {
                console.warn('Combo old image cleanup failed:', cleanupError.message);
            }
        }

        res.json({
            success: true,
            data: {
                ComboID: comboPack.ComboID,
                ImageURL: imageUrl
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to upload image' });
    }
};

module.exports = {
    createComboPack,
    getAllComboPacks,
    getActiveComboPacks,
    getComboPack,
    updateComboPack,
    deleteComboPack,
    uploadImage
};
