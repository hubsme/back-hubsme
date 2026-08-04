import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ServiceRequestCreateDto {
  @ApiProperty({ type: [Number], example: [8, 12, 19], minItems: 1, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  consultantIds: number[];

  @ApiProperty({ example: 'Capacitación de seguridad para el personal', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'Necesitamos capacitar a 25 colaboradores de operaciones.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 'Dos sesiones presenciales, material digital y evaluación final.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  requirements: string;

  @ApiPropertyOptional({ example: 'Disponibilidad durante la segunda semana del mes.', maxLength: 5000 })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  details?: string;
}
