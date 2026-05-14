import { ApiProperty } from '@nestjs/swagger';

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
