const express = require('express');
const router = express.Router();
const preorderRequestController = require('../controllers/preorderRequestController');
const { authenticateToken, requireCustomer, requireAdmin } = require('../middleware/auth');

router.post('/', requireCustomer, preorderRequestController.createPreorderRequest);
router.get('/', authenticateToken, preorderRequestController.getPreorderRequests);
router.get('/:id', authenticateToken, preorderRequestController.getPreorderRequestById);
router.patch('/:id/status', requireAdmin, preorderRequestController.updatePreorderRequestStatus);

module.exports = router;
