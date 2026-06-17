import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ConsultantGoogleCalendarAuthUrlDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;
}

export class ConsultantGoogleCalendarAuthUrlResponseDto {
  @ApiProperty({ example: 'https://accounts.google.com/o/oauth2/v2/auth?...' })
  url: string;
}

export class ConsultantGoogleCalendarCallbackDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  error?: string;
}
