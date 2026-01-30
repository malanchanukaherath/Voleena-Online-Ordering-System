const express = require('express');
const router = express.Router();
const { Category } = require('../models');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { IsActive: true },
            order: [['CategoryName', 'ASC']]
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

module.exports = router;
