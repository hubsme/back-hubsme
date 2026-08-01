import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const FEEDBACK_MAX_IMAGES = 5;
export const FEEDBACK_MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export function isAllowedFeedbackImage(mimeType: string): boolean {
  return allowedImageMimeTypes.has(mimeType.toLowerCase());
}

export function hasValidFeedbackImageSignature(file: Express.Multer.File): boolean {
  const buffer = file.buffer;
  if (!buffer?.length) return false;

  switch (file.mimetype.toLowerCase()) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    case 'image/webp':
      return (
        buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
      );
    case 'image/heic':
    case 'image/heif': {
      if (buffer.length < 12 || buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
      const brands = buffer.toString('ascii', 8, Math.min(buffer.length, 40));
      return ['heic', 'heix', 'hevc', 'hevx', 'heif', 'mif1', 'msf1'].some((brand) => brands.includes(brand));
    }
    default:
      return false;
  }
}

export const feedbackImageUploadOptions: MulterOptions = {
  limits: {
    files: FEEDBACK_MAX_IMAGES,
    fileSize: FEEDBACK_MAX_IMAGE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedFeedbackImage(file.mimetype)) {
      callback(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP, HEIC o HEIF'), false);
      return;
    }
    callback(null, true);
  },
};
