const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// All stock routes require staff authentication
router.use(authenticateToken);
router.use(requireStaff);

// Get today's stock
router.get('/daily', stockController.getTodayStock);

// Set opening stock
router.post('/daily', stockController.setOpeningStock);

// Bulk set opening stock
router.post('/daily/bulk', stockController.bulkSetOpeningStock);

// Adjust stock
router.patch('/daily/:id', stockController.adjustStock);

// Get stock movements (audit trail)
router.get('/movements', stockController.getStockMovements);

module.exports = router;
