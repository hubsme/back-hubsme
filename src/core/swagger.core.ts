import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { SwaggerFunction } from '@functions/swagger.function';

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerFunction.createDocument(app);
  SwaggerModule.setup('api', app, document);
}
