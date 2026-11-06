import { Trace } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

// Servicio principal de la aplicación.
@Trace({ name: 'app', type: 'service' })
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
