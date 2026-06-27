import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConsultantEducationDto {
  @ApiProperty({ example: 'Contabilidad y Finanzas' })
  @IsString()
  degree: string;

  @ApiPropertyOptional({ example: 'Universidad de Lima' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ example: '2014' })
  @IsString()
  @IsOptional()
  year?: string;
}

export class ConsultantCaseStudyDto {
  @ApiProperty({ example: 'Orden financiero para cadena gastronómica' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'No contaban con flujo de caja proyectado.' })
  @IsString()
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({ example: 'Implementó tablero financiero y control semanal.' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ example: 'Reducción de quiebres de caja en 35%.' })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiPropertyOptional({ example: 'Gastronomía' })
  @IsString()
  @IsOptional()
  sector?: string;
}
