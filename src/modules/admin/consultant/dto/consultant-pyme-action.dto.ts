import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConsultantPymeActionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiPropertyOptional({ example: 'Puedo ayudarte con este diagnostico.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConsultantPymeMessageActionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 'Hola, te propongo revisar los avances en una llamada.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
