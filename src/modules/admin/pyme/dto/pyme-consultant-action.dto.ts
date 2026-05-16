import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
