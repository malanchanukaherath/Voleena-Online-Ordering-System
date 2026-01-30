const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    createMenuItem,
    getAllMenuItems,
    getMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadImage
} = require('../controllers/menuItemController');

router.post('/', requireAuth, requireRole('Admin', 'Kitchen'), createMenuItem);
router.get('/', getAllMenuItems);
router.get('/:id', requireAuth, getMenuItem);
router.put('/:id', requireAuth, requireRole('Admin', 'Kitchen'), updateMenuItem);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteMenuItem);
router.post('/:id/image', requireAuth, requireRole('Admin', 'Kitchen'), upload.single('image'), uploadImage);

module.exports = router;
