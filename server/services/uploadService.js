// CODEMAP: BACKEND_SERVICE_UPLOADSERVICE
// PURPOSE: Contains business logic and interacts with databases or external APIs.
// SEARCH_HINT: Look here for core business logic and data access patterns.
const crypto = require('crypto');
const path = require('path');
const { cloudinary, assertCloudinaryConfigured, isCloudinaryConfigured } = require('../config/cloudinary');

const ALLOWED_FOLDERS = ['menu', 'category', 'profile', 'combo'];
const ROOT_FOLDER = process.env.CLOUDINARY_ROOT_FOLDER || 'voleena';

const sanitizeFilename = (filename) => {
    const extension = path.extname(filename || '').toLowerCase();
    const nameWithoutExt = path.basename(filename || 'image', extension);

    const sanitized = nameWithoutExt
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);

    return sanitized || 'image';
};

const resolveTargetFolder = (folder) => {
    if (!folder) {
        return 'menu';
    }

    return ALLOWED_FOLDERS.includes(folder) ? folder : null;
};

const hasAllowedImageSignature = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
        return false;
    }

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF'
        && buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    return isJpeg || isPng || isWebp;
};

const uploadBufferToCloudinary = (buffer, uploadOptions) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });

        uploadStream.end(buffer);
    });
};

const uploadImageFile = async (file, folder = 'menu') => {
    assertCloudinaryConfigured();

    if (!file || !file.buffer) {
        const error = new Error('Image file is required');
        error.statusCode = 400;
        throw error;
    }

    if (!hasAllowedImageSignature(file.buffer)) {
        const error = new Error('Only valid image files (JPEG, PNG, WEBP) are allowed');
        error.statusCode = 400;
        throw error;
    }

    const targetFolder = resolveTargetFolder(folder);
    if (!targetFolder) {
        const error = new Error('Invalid folder. Allowed values: menu, category, profile, combo');
        error.statusCode = 400;
        throw error;
    }

    const safeBaseName = sanitizeFilename(file.originalname);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const uploadResult = await uploadBufferToCloudinary(file.buffer, {
        folder: `${ROOT_FOLDER}/${targetFolder}`,
        public_id: `${safeBaseName}-${uniqueSuffix}`,
        overwrite: false,
        resource_type: 'image'
    });

    return {
        secureUrl: uploadResult.secure_url,
        folder: targetFolder,
        publicId: uploadResult.public_id
    };
};

const extractPublicIdFromUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch (error) {
        return null;
    }

    if (!parsedUrl.hostname.includes('res.cloudinary.com')) {
        return null;
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = pathSegments.indexOf('upload');

    if (uploadIndex < 0) {
        return null;
    }

    const segmentsAfterUpload = pathSegments.slice(uploadIndex + 1);
    if (segmentsAfterUpload.length === 0) {
        return null;
    }

    const versionIndex = segmentsAfterUpload.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments = versionIndex >= 0
        ? segmentsAfterUpload.slice(versionIndex + 1)
        : segmentsAfterUpload;

    if (publicIdSegments.length === 0) {
        return null;
    }

    const lastSegment = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(/\.[^.]+$/, '');

    return publicIdSegments.join('/');
};

const deleteImageByUrl = async (imageUrl) => {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (!publicId) {
        return { deleted: false, reason: 'invalid-or-non-cloudinary-url' };
    }

    if (!isCloudinaryConfigured) {
        return { deleted: false, reason: 'cloudinary-not-configured' };
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return {
        deleted: result.result === 'ok' || result.result === 'not found',
        result: result.result,
        publicId
    };
};

module.exports = {
    uploadImageFile,
    deleteImageByUrl,
    extractPublicIdFromUrl,
    hasAllowedImageSignature,
    ALLOWED_FOLDERS
};
