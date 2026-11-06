import { INestApplication, ValidationPipe } from '@nestjs/common';

export function setupTransformer(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );
}
