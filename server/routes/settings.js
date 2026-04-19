// CODEMAP: BACKEND_ROUTE_SETTINGS
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
const express = require('express');
const router = express.Router();
const systemSettingsService = require('../services/systemSettingsService');

/**
 * Public settings used by customer-facing UI components.
 */
router.get('/public', async (req, res) => {
    try {
        const settings = await systemSettingsService.getPublicSettings();

        return res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get public settings error:', error);
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to fetch public settings'
        });
    }
});

module.exports = router;
