import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConsultantCreateDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Consultor en transformacion digital para PYMES.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: ['Tecnologia', 'Operaciones'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiPropertyOptional({ example: ['Retail', 'Manufactura'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sectors?: string[];

  @ApiPropertyOptional({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerHour?: number;

  @ApiPropertyOptional({ enum: ['true', 'false'], default: 'true' })
  @IsIn(['true', 'false'])
  @IsOptional()
  active?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'], default: 'false' })
  @IsIn(['true', 'false'])
  @IsOptional()
  validated?: string;
}
