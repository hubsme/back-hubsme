import type { pymeMember } from '@db/tables/pyme-member.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { Trace } from '@erixcel/traceflow';
import { DiagnosticPayloadDto } from '@modules/admin/modules/diagnostic/dto/find-one.dto';
import {
  PymeConsultantMatchResultDto,
  PymeConsultantMessageResultDto,
} from '@modules/admin/modules/pyme/dto/find-one.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class PymeConsultantActionDto {
  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiPropertyOptional({ example: 'Nos interesa coordinar una primera conversacion.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

@Trace({ type: 'validation' })
export class PymeConsultantMessageActionDto {
  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 'Hola, quisiera revisar una primera sesion esta semana.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

@Trace({ type: 'validation' })
export class PymeConsultantListFiltersDto extends PaginationFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiPropertyOptional({ description: 'Search by consultant name or specialty' })
  @IsString()
  @IsOptional()
  search?: string;
}

@Trace({ type: 'validation' })
export class PymeConsultantMatchListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by PYME or consultant name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pymeId?: number;

  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';
}

@Trace({ type: 'validation' })
export class PymeConsultantMatchListDto {
  @ApiProperty({ type: () => [PymeConsultantMatchResultDto] })
  data: PymeConsultantMatchResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

@Trace({ type: 'validation' })
export class PymeConsultantMessageListDto {
  @ApiProperty({ type: () => [PymeConsultantMessageResultDto] })
  data: PymeConsultantMessageResultDto[];
}

@Trace({ type: 'validation' })
export class PymeMeetingDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true })
  consultantPhotoUrl: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  status: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ nullable: true })
  startTime: Date | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;
}

@Trace({ type: 'validation' })
export class PymeDiagnosticDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: () => DiagnosticPayloadDto })
  result: DiagnosticPayloadDto;

  @ApiProperty()
  score: number;
}

@Trace({ type: 'validation' })
export class PymeListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by business name or RUC' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsString()
  @IsOptional()
  sector?: string;
}

@Trace({ type: 'validation' })
export class PymeListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  ruc: string | null;

  @ApiProperty({ nullable: true })
  ownerFirstName: string | null;

  @ApiProperty({ nullable: true })
  ownerLastName: string | null;

  @ApiProperty({ nullable: true })
  ownerEmail: string | null;

  @ApiProperty({ nullable: true })
  sector: string | null;

  @ApiProperty({ nullable: true })
  numEmployees: number | null;

  @ApiProperty({ nullable: true })
  logoUrl: string | null;

  @ApiProperty()
  createdAt: Date;
}

@Trace({ type: 'validation' })
export class PymeListDto {
  @ApiProperty({ type: () => [PymeListItemDto] })
  data: PymeListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

@Trace({ type: 'validation' })
export class OrganizationSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiProperty({ enum: ['owner', 'member'] })
  membershipRole: (typeof pymeMember.$inferSelect)['role'];
}

@Trace({ type: 'validation' })
export class InvitationTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

@Trace({ type: 'validation' })
export class PymeConsultantParticipantMessageFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;
}

@Trace({ type: 'validation' })
export class PymeConsultantMessageListFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  matchId: number;
}
