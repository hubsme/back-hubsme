import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MEETING_PAYOUT_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
export const MEETING_PAYOUT_EVIDENCE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

export const meetingPayoutEvidenceUploadOptions: MulterOptions = {
  limits: { fileSize: MEETING_PAYOUT_EVIDENCE_MAX_BYTES, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (
      !MEETING_PAYOUT_EVIDENCE_MIME_TYPES.includes(file.mimetype as (typeof MEETING_PAYOUT_EVIDENCE_MIME_TYPES)[number])
    ) {
      callback(new BadRequestException('La constancia debe ser PDF, JPG, PNG o WEBP'), false);
      return;
    }
    callback(null, true);
  },
};
