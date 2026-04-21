jest.mock('../config/cloudinary', () => ({
  assertCloudinaryConfigured: jest.fn(),
  isCloudinaryConfigured: true,
  cloudinary: {
    uploader: {
      upload_stream: jest.fn((options, callback) => ({
        end: jest.fn(() => callback(null, {
          secure_url: 'https://example.test/image.jpg',
          public_id: `${options.folder}/image`
        }))
      }))
    }
  }
}));

const { uploadImageFile, hasAllowedImageSignature } = require('../services/uploadService');
const { cloudinary } = require('../config/cloudinary');

describe('upload service image validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects files whose content is not a supported image', async () => {
    await expect(uploadImageFile({
      buffer: Buffer.from('not really an image'),
      originalname: 'fake.jpg'
    }, 'menu')).rejects.toMatchObject({
      statusCode: 400
    });

    expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  });

  test('accepts supported image signatures before uploading', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

    expect(hasAllowedImageSignature(jpeg)).toBe(true);

    const result = await uploadImageFile({
      buffer: jpeg,
      originalname: 'menu.jpg'
    }, 'menu');

    expect(result.secureUrl).toBe('https://example.test/image.jpg');
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(1);
  });
});



