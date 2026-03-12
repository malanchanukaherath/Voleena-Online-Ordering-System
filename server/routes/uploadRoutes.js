const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const { uploadImage, getUploadFolders } = require('../controllers/uploadController');

router.get('/folders', requireAuth, getUploadFolders);
router.post('/image', requireAuth, upload.single('image'), uploadImage);

module.exports = router;
