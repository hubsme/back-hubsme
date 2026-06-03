import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class PymeConsultantMatchResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty({ nullable: true })
  pymeName: string | null;

  @ApiProperty({ nullable: true })
  pymeSector: string | null;

  @ApiProperty({ nullable: true })
  pymeNumEmployees: number | null;

  @ApiProperty({ nullable: true })
  pymeYearsInOperation: number | null;

  @ApiProperty({ nullable: true })
  pymeDescription: string | null;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ nullable: true })
  consultantName: string | null;

  @ApiProperty({ nullable: true })
  consultantBio: string | null;

  @ApiProperty({ type: [String] })
  consultantSpecialties: string[];

  @ApiProperty({ nullable: true })
  consultantPhotoUrl: string | null;

  @ApiProperty()
  consultantPricePerHour: string;

  @ApiProperty()
  consultantRating: string;

  @ApiProperty({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  status: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiProperty()
  source: string;

  @ApiProperty({ nullable: true })
  notes: string | null;
}

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

export class PymeConsultantMatchListDto {
  @ApiProperty({ type: [PymeConsultantMatchResultDto] })
  data: PymeConsultantMatchResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PymeConsultantMatchCreateDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'], default: 'pendiente' })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiPropertyOptional({ example: 'diagnostico' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'Match generado por afinidad de sector y especialidad.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class PymeConsultantMatchUpdateDto extends PartialType(PymeConsultantMatchCreateDto) {}
