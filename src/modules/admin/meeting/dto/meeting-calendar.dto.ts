import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';
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

  @ApiProperty({
    required: false,
    enum: ['solicitada', 'pendiente', 'confirmada', 'finalizada', 'cancelada'],
    description: 'Estado visible. Pendiente agrupa pago pendiente y por confirmar.',
  })
  @IsIn(['solicitada', 'pendiente', 'confirmada', 'finalizada', 'cancelada'])
  @IsOptional()
  status?: 'solicitada' | 'pendiente' | 'confirmada' | 'finalizada' | 'cancelada';
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

  @ApiProperty({ nullable: true })
  serviceRequestId: number | null;

  @ApiProperty({ nullable: true })
  serviceMilestoneIndex: number | null;

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

  @ApiProperty({ description: 'Indica si la reunión tiene un acceso virtual configurado' })
  hasMeetingLink: boolean;

  @ApiProperty({
    enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'],
  })
  status: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  requestedBy: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['consultoria', 'servicio'] })
  meetingType: 'consultoria' | 'servicio';

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ nullable: true, type: String })
  cancellationReason: string | null;

  @ApiProperty({ nullable: true, type: Date })
  completedAt: Date | null;
}

export class MeetingCalendarListDto {
  @ApiProperty({ type: [MeetingCalendarItemDto] })
  data: MeetingCalendarItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
