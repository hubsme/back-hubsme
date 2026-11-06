import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

@Trace({ type: 'validation' })
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
