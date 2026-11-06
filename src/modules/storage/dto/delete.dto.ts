import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class StorageDeleteParamsDto {
  @ApiProperty({ description: 'Ruta del archivo en Azure Storage' })
  @IsString()
  publicId: string;
}
