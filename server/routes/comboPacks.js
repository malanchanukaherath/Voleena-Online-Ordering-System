const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    createComboPack,
    getAllComboPacks,
    getActiveComboPacks,
    getComboPack,
    updateComboPack,
    deleteComboPack,
    uploadImage
} = require('../controllers/comboPackController');

router.post('/', requireAuth, requireRole('Admin'), createComboPack);
router.get('/active', getActiveComboPacks);
router.get('/', requireAuth, requireRole('Admin', 'Kitchen', 'Cashier'), getAllComboPacks);
router.get('/:id', requireAuth, getComboPack);
router.put('/:id', requireAuth, requireRole('Admin'), updateComboPack);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteComboPack);
router.post('/:id/image', requireAuth, requireRole('Admin'), upload.single('image'), uploadImage);

module.exports = router;
