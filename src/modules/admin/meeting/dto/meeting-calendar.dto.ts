import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class MeetingCalendarFiltersDto extends PaginationFiltersDto {
  @ApiProperty({
    description: 'Inclusive beginning of the visible calendar range',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Exclusive end of the visible calendar range',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsDateString()
  endDate: string;
}

export class MeetingCalendarItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true, type: String })
  consultantPhotoUrl: string | null;

  @ApiProperty({ example: '150.00' })
  consultantPricePerHour: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: Date })
  startTime: Date | null;

  @ApiProperty({ type: [String] })
  proposedStartTimes: string[];

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ nullable: true, type: String })
  meetingUrl: string | null;

  @ApiProperty({
    enum: ['solicitada', 'pago_pendiente', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'],
  })
  status: 'solicitada' | 'pago_pendiente' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  requestedBy: 'pyme' | 'consultor';

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ nullable: true, type: Date })
  completedAt: Date | null;
}

export class MeetingCalendarListDto {
  @ApiProperty({ type: [MeetingCalendarItemDto] })
  data: MeetingCalendarItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
