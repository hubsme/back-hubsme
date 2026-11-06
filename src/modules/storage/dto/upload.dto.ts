import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Trace({ type: 'validation' })
export class StorageUploadBodyDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  file?: string;
}

@Trace({ type: 'validation' })
export class StorageResultDto {
  @ApiProperty()
  publicId: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  secureUrl: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  bytes: number;

  @ApiProperty()
  resourceType: string;

  @ApiProperty()
  createdAt: string;
}
