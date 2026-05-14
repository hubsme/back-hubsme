import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

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
