import { ApiProperty } from '@nestjs/swagger';
import type { ConsultantAvailabilitySchedule } from '@db/tables/consultant-availability.table';

export class ConsultantAvailabilityResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ example: '2026-06-01', format: 'date' })
  month: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'string', example: '08:00' },
    },
    example: {
      '23': ['08:00', '08:30'],
    },
  })
  availableSchedule: ConsultantAvailabilitySchedule;
}
