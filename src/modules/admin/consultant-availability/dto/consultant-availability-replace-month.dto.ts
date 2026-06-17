import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, Max, Min } from 'class-validator';
import type { ConsultantAvailabilitySchedule } from '@db/tables/consultant-availability.table';

export class ConsultantAvailabilityReplaceMonthDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  year: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string', example: '08:00' },
    },
    example: {
      '23': ['08:00', '08:30'],
    },
    description: 'Dias del mes con horas disponibles en bloques de 30 minutos. Cada hora representa el inicio del bloque.',
  })
  @IsObject()
  availableSchedule: ConsultantAvailabilitySchedule;
}
