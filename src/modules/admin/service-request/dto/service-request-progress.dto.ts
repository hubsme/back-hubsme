import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ServiceRequestExtraMilestoneMeetingDto {
  @ApiProperty({ example: 2, minimum: 1, maximum: 19 })
  @IsInt()
  @Min(1)
  @Max(19)
  insertAtIndex: number;

  @ApiProperty({ example: 'Validación final con contabilidad' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: '2026-09-20' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate: string;

  @ApiProperty({
    type: [String],
    example: ['2026-09-17T15:00:00.000Z', '2026-09-18T15:00:00.000Z', '2026-09-19T15:00:00.000Z'],
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  proposedStartTimes: string[];
}

export class ServiceRequestMilestoneUpdateDto {
  @ApiProperty({ example: 'Validación final con contabilidad', maxLength: 160 })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: '2026-09-20' })
  @IsDateString({ strict: true })
  dueDate: string;
}

export class ServiceRequestEvidenceMultipartDto {
  @ApiPropertyOptional({ example: 'Constancia SUNAT correspondiente al primer entregable.' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 49 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(49)
  @IsOptional()
  milestoneIndex?: number;
}
