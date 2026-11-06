import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsEmail, Min } from 'class-validator';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class PymeConsultantMessageCreateDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  matchId: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  senderId: number;

  @ApiProperty({ example: 'Hola, revisemos una primera sesion esta semana.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

@Trace({ type: 'validation' })
export class PymeCreateDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'Textiles del Sur SAC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '20600000001' })
  @IsString()
  @IsOptional()
  ruc?: string;

  @ApiPropertyOptional({ example: 'Maria' })
  @IsString()
  @IsOptional()
  ownerFirstName?: string;

  @ApiPropertyOptional({ example: 'Torres' })
  @IsString()
  @IsOptional()
  ownerLastName?: string;

  @ApiPropertyOptional({ example: 'maria@empresa.com' })
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @ApiPropertyOptional({ example: '+51999888777' })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ example: 'Gerente general' })
  @IsString()
  @IsOptional()
  ownerPosition?: string;

  @ApiPropertyOptional({ example: 'Manufactura' })
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional({ example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  numEmployees?: number;

  @ApiPropertyOptional({ example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  yearsInOperation?: number;

  @ApiPropertyOptional({ example: 'PYME textil peruana en proceso de digitalizacion.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/pymes/logo.jpg' })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
