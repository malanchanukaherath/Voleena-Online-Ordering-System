const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken, requireRole, requireAdmin, requireKitchen } = require('../middleware/auth');

/**
 * Stock Management Routes
 * 
 * PART 2 & 3: Role-based access control
 * - Admin: Full read/write access to stock
 * - Kitchen: Read-only access to stock with low-stock alerts
 */

// =====================================================
// ADMIN ONLY ROUTES (R/W)
// =====================================================

// Update opening quantity (admin + kitchen)
router.put(
    '/update/:stockId',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.updateOpeningQuantity
);

// Manual stock adjustment (admin + kitchen)
router.post(
    '/manual-adjust/:stockId',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.manualAdjustStock
);

// =====================================================
// ADMIN + KITCHEN ROUTES (Read-only for kitchen)
// =====================================================

// Get today's stock (with low-stock alerts)
// Admin: Full details | Kitchen: Read-only
router.get(
    '/today',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.getTodayStock
);

// Get stock movements audit trail
router.get(
    '/movements',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.getStockMovements
);

// Remove a stock record (admin + kitchen)
router.delete(
    '/:stockId',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.deleteStockRecord
);

// =====================================================
// LEGACY ROUTES (Backward compatibility)
// =====================================================

// Set opening stock (legacy, use updateOpeningQuantity instead)
router.post(
    '/daily',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.setOpeningStock
);

// Bulk set opening stock (legacy)
router.post(
    '/daily/bulk',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.bulkSetOpeningStock
);

// Adjust stock (legacy, use manualAdjustStock instead)
router.patch(
    '/daily/:id',
    authenticateToken,
    requireRole('Admin', 'Kitchen'),
    stockController.adjustStock
);

module.exports = router;
