// CODEMAP: BACKEND_ROUTE_UPLOADROUTES
// PURPOSE: Defines API endpoints and links them to controller functions.
// SEARCH_HINT: Look here for route definitions and middleware application.
const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadImage, getUploadFolders } = require('../controllers/uploadController');

router.get('/folders', requireAuth, getUploadFolders);
router.post('/image', requireAuth, uploadLimiter, upload.single('image'), uploadImage);

module.exports = router;
