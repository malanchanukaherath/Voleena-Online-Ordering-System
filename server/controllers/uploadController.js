// CODEMAP: BACKEND_CONTROLLER_UPLOADCONTROLLER
// PURPOSE: Handles incoming requests, processes logic, and returns responses.
// SEARCH_HINT: Look here for request handling logic and data processing.
const { uploadImageFile, ALLOWED_FOLDERS } = require('../services/uploadService');

const STAFF_MANAGED_FOLDERS = new Set(['menu', 'category', 'combo']);

// Code Review: Function getRequestedFolder in server\controllers\uploadController.js. Used in: server/controllers/uploadController.js.
const getRequestedFolder = (body) => {
    return typeof body?.folder === 'string' && body.folder.trim()
        ? body.folder.trim()
        : 'menu';
};

// Code Review: Function canUploadToFolder in server\controllers\uploadController.js. Used in: server/controllers/uploadController.js.
const canUploadToFolder = (user, folder) => {
    if (folder === 'profile') {
        return true;
    }

    return user?.type === 'Staff' && STAFF_MANAGED_FOLDERS.has(folder);
};

// Code Review: Function uploadImage in server\controllers\uploadController.js. Used in: client/src/components/ImageUpload.jsx, client/src/services/menuService.js, server/controllers/comboPackController.js.
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required (field name: image)' });
        }

        const requestedFolder = getRequestedFolder(req.body);

        if (!ALLOWED_FOLDERS.includes(requestedFolder)) {
            return res.status(400).json({ error: 'Invalid folder. Allowed values: menu, category, profile, combo' });
        }

        if (!canUploadToFolder(req.user, requestedFolder)) {
            return res.status(403).json({ error: 'You do not have permission to upload to this folder' });
        }

        const result = await uploadImageFile(req.file, requestedFolder);

        return res.status(201).json({
            imageUrl: result.secureUrl
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }

        console.error('Upload image error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
    }
};

// Code Review: Function getUploadFolders in server\controllers\uploadController.js. Used in: server/controllers/uploadController.js, server/routes/uploadRoutes.js, server/tests/route-contracts.test.js.
const getUploadFolders = (req, res) => {
    if (req.user?.type === 'Customer') {
        return res.json({
            folders: ['profile']
        });
    }

    return res.json({
        folders: ALLOWED_FOLDERS
    });
};

module.exports = {
    uploadImage,
    getUploadFolders
};
