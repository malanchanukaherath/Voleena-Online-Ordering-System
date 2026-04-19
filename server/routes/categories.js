// CODEMAP: BACKEND_ROUTE_CATEGORIES
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { deleteImageByUrl } = require('../services/uploadService');

router.get('/', requireAuth, async (req, res) => {
    try {
        const { isActive, includeInactive } = req.query;
        const where = {};

        if (isActive !== undefined) {
            where.IsActive = isActive === 'true';
        } else if (includeInactive !== 'true') {
            where.IsActive = true;
        }

        const categories = await Category.findAll({
            where,
            order: [
                [require('sequelize').col('Category.display_order'), 'ASC'],
                [require('sequelize').col('Category.name'), 'ASC']
            ]
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
    try {
        const { Name, Description, DisplayOrder, IsActive, ImageURL } = req.body;

        if (!Name || Name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        const existing = await Category.findOne({
            where: { Name: Name.trim() }
        });

        if (existing) {
            return res.status(409).json({ error: 'Category name already exists' });
        }

        const category = await Category.create({
            Name: Name.trim(),
            Description: Description ? Description.trim() : null,
            ImageURL: ImageURL || null,
            DisplayOrder: DisplayOrder !== undefined ? parseInt(DisplayOrder, 10) : 0,
            IsActive: IsActive !== undefined ? !!IsActive : true
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

router.put('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Description, DisplayOrder, IsActive, ImageURL } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const previousImageUrl = category.ImageURL || null;

        if (Name && Name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        if (Name && Name.trim() !== category.Name) {
            const existing = await Category.findOne({
                where: { Name: Name.trim() }
            });

            if (existing) {
                return res.status(409).json({ error: 'Category name already exists' });
            }
        }

        const updateData = {};
        if (Name !== undefined) updateData.Name = Name.trim();
        if (Description !== undefined) updateData.Description = Description ? Description.trim() : null;
        if (ImageURL !== undefined) updateData.ImageURL = ImageURL || null;
        if (DisplayOrder !== undefined) updateData.DisplayOrder = parseInt(DisplayOrder, 10);
        if (IsActive !== undefined) updateData.IsActive = !!IsActive;

        await category.update(updateData);

        if (ImageURL !== undefined) {
            const nextImageUrl = ImageURL || null;
            if (previousImageUrl && previousImageUrl !== nextImageUrl) {
                try {
                    await deleteImageByUrl(previousImageUrl);
                } catch (cleanupError) {
                    console.warn('Category old image cleanup failed:', cleanupError.message);
                }
            }
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await category.update({ IsActive: false });

        res.json({
            success: true,
            message: 'Category deactivated successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;
