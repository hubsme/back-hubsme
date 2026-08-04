import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Hubsme API Documentation')
    .setDescription('API endpoints for the Hubsme consulting platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication) {
  const document = createSwaggerDocument(app);
  SwaggerModule.setup('api', app, document);
}
