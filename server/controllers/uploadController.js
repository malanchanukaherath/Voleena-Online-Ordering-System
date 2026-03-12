const { uploadImageFile, ALLOWED_FOLDERS } = require('../services/uploadService');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required (field name: image)' });
        }

        const requestedFolder = req.body?.folder || 'menu';
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

const getUploadFolders = (req, res) => {
    return res.json({
        folders: ALLOWED_FOLDERS
    });
};

module.exports = {
    uploadImage,
    getUploadFolders
};
