import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
