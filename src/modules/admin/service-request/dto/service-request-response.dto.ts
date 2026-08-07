import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ServiceRequestProposalDto {
  @ApiProperty({ example: 1850.5, minimum: 1 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  price: number;

  @ApiPropertyOptional({ example: '2026-08-12T15:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  selectedInitialMeetingStartTime?: string;

  @ApiPropertyOptional({ example: 'Incluye materiales y dos jornadas de capacitación.', maxLength: 3000 })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  message?: string;
}

export class ServiceRequestDeclineDto {
  @ApiPropertyOptional({ example: 'No podremos continuar con esta solicitud.', maxLength: 3000 })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  message?: string;
}
