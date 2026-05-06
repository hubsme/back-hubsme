import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { setupSwagger } from '@core/swagger.core';
import { setupTransformer } from '@core/transformer.core';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupTransformer(app);
  setupSwagger(app);
  app.enableCors();

  await app.listen(3000);
}
bootstrap();
