const { MenuItem, Category, Staff, DailyStock } = require('../models');
const { Op, col, literal } = require('sequelize');
const { uploadImageFile, deleteImageByUrl } = require('../services/uploadService');

const createMenuItem = async (req, res) => {
    try {
        const { Name, Description, Price, CategoryID, IsActive, ImageURL } = req.body;

        if (!Name || Name.trim().length < 3) {
            return res.status(400).json({ error: 'Name must be at least 3 characters' });
        }

        if (!Price || parseFloat(Price) <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        if (!CategoryID) {
            return res.status(400).json({ error: 'CategoryID is required' });
        }

        const category = await Category.findByPk(CategoryID);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const menuItem = await MenuItem.create({
            Name: Name.trim(),
            Description: Description ? Description.trim() : null,
            Price: parseFloat(Price),
            CategoryID,
            ImageURL: ImageURL || null,
            IsActive: IsActive !== undefined ? IsActive : true,
            CreatedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
};

const getAllMenuItems = async (req, res) => {
    try {
        const { categoryId, isActive, search } = req.query;

        const where = {};

        if (categoryId) {
            where.CategoryID = categoryId;
        }

        if (isActive !== undefined) {
            where.IsActive = isActive === 'true';
        }

        if (search) {
            where.Name = { [Op.like]: `%${search}%` };
        }

        const menuItems = await MenuItem.findAll({
            where,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['CategoryID', 'Name']
            }],
            order: [[literal('`MenuItem`.`created_at`'), 'DESC']]
        });

        const today = new Date().toISOString().split('T')[0];
        const menuItemIds = menuItems.map(item => item.MenuItemID);

        let stockMap = new Map();
        if (menuItemIds.length > 0) {
            const todaysStock = await DailyStock.findAll({
                where: {
                    MenuItemID: menuItemIds,
                    StockDate: today
                },
                attributes: ['MenuItemID', 'ClosingQuantity'],
                raw: true
            });

            stockMap = new Map(
                todaysStock.map(stock => [stock.MenuItemID, stock.ClosingQuantity])
            );
        }

        const enrichedMenuItems = menuItems.map(item => {
            const json = item.toJSON();
            const stockQuantity = stockMap.has(item.MenuItemID) ? stockMap.get(item.MenuItemID) : null;
            const effectiveAvailability = stockQuantity !== null
                ? stockQuantity > 0
                : json.IsAvailable;

            return {
                ...json,
                StockQuantity: stockQuantity,
                IsAvailable: effectiveAvailability
            };
        });

        res.json({
            success: true,
            data: enrichedMenuItems,
            count: enrichedMenuItems.length
        });
    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
};

const getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const menuItem = await MenuItem.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['CategoryID', 'Name']
            }]
        });

        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Get menu item error:', error);
        res.status(500).json({ error: 'Failed to fetch menu item' });
    }
};

const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Description, Price, CategoryID, IsActive, ImageURL } = req.body;

        const menuItem = await MenuItem.findByPk(id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        const previousImageUrl = menuItem.ImageURL || null;

        if (Name && Name.trim().length < 3) {
            return res.status(400).json({ error: 'Name must be at least 3 characters' });
        }

        if (Price && parseFloat(Price) <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }

        if (CategoryID) {
            const category = await Category.findByPk(CategoryID);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
        }

        const updateData = {};
        if (Name) updateData.Name = Name.trim();
        if (Description !== undefined) updateData.Description = Description ? Description.trim() : null;
        if (Price) updateData.Price = parseFloat(Price);
        if (CategoryID) updateData.CategoryID = CategoryID;
        if (ImageURL !== undefined) updateData.ImageURL = ImageURL || null;
        if (IsActive !== undefined) updateData.IsActive = IsActive;
        updateData.updatedAt = new Date();

        await menuItem.update(updateData);

        if (ImageURL !== undefined) {
            const nextImageUrl = ImageURL || null;
            if (previousImageUrl && previousImageUrl !== nextImageUrl) {
                try {
                    await deleteImageByUrl(previousImageUrl);
                } catch (cleanupError) {
                    console.warn('Menu old image cleanup failed:', cleanupError.message);
                }
            }
        }

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
};

const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const menuItem = await MenuItem.findByPk(id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        await menuItem.update({ IsActive: false });

        res.json({
            success: true,
            message: 'Menu item deactivated successfully'
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
};

const uploadImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const menuItem = await MenuItem.findByPk(id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        const previousImageUrl = menuItem.ImageURL || null;

        const { secureUrl } = await uploadImageFile(req.file, 'menu');
        const imageUrl = secureUrl;
        await menuItem.update({ ImageURL: imageUrl });

        if (previousImageUrl && previousImageUrl !== imageUrl) {
            try {
                await deleteImageByUrl(previousImageUrl);
            } catch (cleanupError) {
                console.warn('Menu old image cleanup failed:', cleanupError.message);
            }
        }

        res.json({
            success: true,
            data: {
                MenuItemID: menuItem.MenuItemID,
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
    createMenuItem,
    getAllMenuItems,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadImage
};
