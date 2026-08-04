import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ServiceRequestDraftDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  requirements: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  details: string;
}
