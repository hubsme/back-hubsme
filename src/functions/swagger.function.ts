import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { TraceNode } from '@erixcel/traceflow';

export class SwaggerFunction {
  @TraceNode({ name: 'Crear contrato OpenAPI', type: 'method' })
  static createDocument(app: INestApplication): OpenAPIObject {
    const config = new DocumentBuilder()
      .setTitle('Hubsme API Documentation')
      .setDescription('API endpoints for the Hubsme consulting platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    return SwaggerModule.createDocument(app, config);
  }
}
