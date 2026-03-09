const { ComboPack, ComboPackItem, MenuItem } = require('../models');
const { Op, literal } = require('sequelize');
const db = require('../models');

const createComboPack = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { Name, Description, Price, ScheduleStartDate, ScheduleEndDate, IsActive, items } = req.body;

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

        const createdCombo = await ComboPack.findByPk(comboPack.ComboPackID, {
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

        const enrichedCombos = comboPacks.map(combo => {
            const comboData = combo.toJSON();
            const originalPrice = comboData.items.reduce((sum, item) => {
                return sum + (item.menuItem.Price * item.Quantity);
            }, 0);
            const discount = originalPrice - comboData.Price;
            const discountPercentage = originalPrice > 0 ? ((discount / originalPrice) * 100).toFixed(2) : 0;

            return {
                ...comboData,
                OriginalPrice: originalPrice,
                Discount: discount,
                DiscountPercentage: parseFloat(discountPercentage)
            };
        });

        res.json({
            success: true,
            data: enrichedCombos
        });
    } catch (error) {
        console.error('Get combo packs error:', error);
        res.status(500).json({ error: 'Failed to fetch combo packs' });
    }
};

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

        const enrichedCombos = comboPacks.map(combo => {
            const comboData = combo.toJSON();
            const originalPrice = comboData.items.reduce((sum, item) => {
                return sum + (item.menuItem.Price * item.Quantity);
            }, 0);
            const discount = originalPrice - comboData.Price;
            const discountPercentage = originalPrice > 0 ? ((discount / originalPrice) * 100).toFixed(2) : 0;

            return {
                ...comboData,
                OriginalPrice: originalPrice,
                Discount: discount,
                DiscountPercentage: parseFloat(discountPercentage)
            };
        });

        res.json({
            success: true,
            data: enrichedCombos
        });
    } catch (error) {
        console.error('Get active combo packs error:', error);
        res.status(500).json({ error: 'Failed to fetch active combo packs' });
    }
};

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

        const comboData = comboPack.toJSON();
        const originalPrice = comboData.items.reduce((sum, item) => {
            return sum + (item.menuItem.Price * item.Quantity);
        }, 0);
        const discount = originalPrice - comboData.Price;
        const discountPercentage = originalPrice > 0 ? ((discount / originalPrice) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                ...comboData,
                OriginalPrice: originalPrice,
                Discount: discount,
                DiscountPercentage: parseFloat(discountPercentage)
            }
        });
    } catch (error) {
        console.error('Get combo pack error:', error);
        res.status(500).json({ error: 'Failed to fetch combo pack' });
    }
};

const updateComboPack = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { Name, Description, Price, ScheduleStartDate, ScheduleEndDate, IsActive, items } = req.body;

        const comboPack = await ComboPack.findByPk(id);
        if (!comboPack) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Combo pack not found' });
        }

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
                    return res.status(404).json({
                        success: false,
                        message: `Menu item with ID ${item.MenuItemID} not found`
                    });
                }
                if (!menuItem.IsActive) {
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

        const imageUrl = `/uploads/menu-images/${req.file.filename}`;
        await comboPack.update({ Image_URL: imageUrl });

        res.json({
            success: true,
            data: {
                ComboPackID: comboPack.ComboPackID,
                Image_URL: imageUrl
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);
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
