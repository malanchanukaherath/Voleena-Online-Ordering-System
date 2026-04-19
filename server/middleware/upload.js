const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.jpe?g|\.png|\.webp$/i;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// File filter - only images
// Code Review: Function fileFilter in server\middleware\upload.js. Used in: server/middleware/upload.js.
const fileFilter = (req, file, cb) => {
    const normalizedName = (file.originalname || '').toLowerCase();
    const extname = ALLOWED_EXTENSIONS.test(normalizedName);
    const mimetype = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        const error = new Error('Only image files (JPEG, PNG, WEBP) are allowed');
        error.statusCode = 400;
        cb(error);
    }
};

// Create multer instance
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

module.exports = upload;
