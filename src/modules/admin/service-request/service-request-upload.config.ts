import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const SERVICE_REQUEST_MAX_FILES = 5;
export const SERVICE_REQUEST_MAX_FILE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

export function isAllowedServiceRequestFile(mimeType: string): boolean {
  return allowedMimeTypes.has(mimeType.toLowerCase());
}

export function hasValidServiceRequestFileSignature(file: Express.Multer.File): boolean {
  const buffer = file.buffer;
  if (!buffer?.length) return false;
  const mimeType = file.mimetype.toLowerCase();

  if (mimeType === 'application/pdf') return buffer.subarray(0, 4).toString('ascii') === '%PDF';
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }
  if (mimeType.includes('openxmlformats')) {
    return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  if (['application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint'].includes(mimeType)) {
    const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(oleHeader);
  }
  return mimeType === 'text/plain' || mimeType === 'text/csv';
}

export const serviceRequestFileUploadOptions: MulterOptions = {
  limits: {
    files: SERVICE_REQUEST_MAX_FILES,
    fileSize: SERVICE_REQUEST_MAX_FILE_BYTES,
  },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedServiceRequestFile(file.mimetype)) {
      callback(new BadRequestException('El archivo debe ser PDF, imagen, Word, Excel, PowerPoint, TXT o CSV'), false);
      return;
    }
    callback(null, true);
  },
};
