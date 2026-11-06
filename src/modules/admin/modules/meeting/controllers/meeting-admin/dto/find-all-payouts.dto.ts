import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { MeetingConsultantPayoutResultDto } from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/mark-payout-paid.dto';

@Trace({ type: 'validation' })
export class MeetingConsultantPayoutFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Busca por reunión, PYME, consultor, referencia o pago de Mercado Pago' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ enum: ['pending', 'paid'] })
  @IsIn(['pending', 'paid'])
  @IsOptional()
  status?: 'pending' | 'paid';
}

@Trace({ type: 'validation' })
export class MeetingConsultantPayoutListDto {
  @ApiProperty({ type: () => [MeetingConsultantPayoutResultDto] })
  data: MeetingConsultantPayoutResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
