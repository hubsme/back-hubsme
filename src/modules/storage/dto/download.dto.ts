import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class StorageDownloadQueryDto {
  @ApiProperty({ description: 'Ruta del archivo que se desea descargar' })
  @IsString()
  path: string;
}
