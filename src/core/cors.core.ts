import type { INestApplication } from '@nestjs/common';

export function setupCors(app: INestApplication): void {
  app.enableCors();
}
