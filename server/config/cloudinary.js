const { v2: cloudinary } = require('cloudinary');

const requiredCloudinaryEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

const missingCloudinaryEnvVars = requiredCloudinaryEnvVars.filter(
    (name) => !process.env[name]
);

const isCloudinaryConfigured = missingCloudinaryEnvVars.length === 0;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

// Simple: This checks if the cloudinary configured is correct.
const assertCloudinaryConfigured = () => {
    if (isCloudinaryConfigured) {
        return;
    }

    const error = new Error(
        `Missing Cloudinary environment variables: ${missingCloudinaryEnvVars.join(', ')}`
    );
    error.statusCode = 500;
    throw error;
};

module.exports = {
    cloudinary,
    assertCloudinaryConfigured,
    isCloudinaryConfigured
};
