// CODEMAP: BACKEND_ROUTE_MENUITEMS
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
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
    uploadImage,
    getAddOnCatalog,
    createAddOnCatalogItem,
    updateAddOnCatalogItem,
    deactivateAddOnCatalogItem,
    getMenuItemAddOnConfig,
    updateMenuItemAddOnConfig
} = require('../controllers/menuItemController');

router.post('/', requireAuth, requireRole('Admin', 'Kitchen'), createMenuItem);
router.get('/', getAllMenuItems);
router.get('/addons/catalog', requireAuth, requireRole('Admin'), getAddOnCatalog);
router.post('/addons/catalog', requireAuth, requireRole('Admin'), createAddOnCatalogItem);
router.put('/addons/catalog/:id', requireAuth, requireRole('Admin'), updateAddOnCatalogItem);
router.delete('/addons/catalog/:id', requireAuth, requireRole('Admin'), deactivateAddOnCatalogItem);
router.get('/:id', getMenuItem);
router.get('/:id/addons-config', requireAuth, requireRole('Admin'), getMenuItemAddOnConfig);
router.put('/:id/addons-config', requireAuth, requireRole('Admin'), updateMenuItemAddOnConfig);
router.put('/:id', requireAuth, requireRole('Admin', 'Kitchen'), updateMenuItem);
router.delete('/:id', requireAuth, requireRole('Admin'), deleteMenuItem);
router.post('/:id/image', requireAuth, requireRole('Admin', 'Kitchen'), upload.single('image'), uploadImage);

module.exports = router;
