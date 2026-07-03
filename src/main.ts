import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { setupSwagger } from '@core/swagger.core';
import { setupTransformer } from '@core/transformer.core';
import { json, urlencoded } from 'express';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  setupTransformer(app);
  setupSwagger(app);
  app.enableCors();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
