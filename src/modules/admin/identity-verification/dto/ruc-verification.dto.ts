import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RucVerificationDto {
  @ApiProperty({ example: '20123456789', description: 'Número de RUC peruano de 11 dígitos' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'ruc debe contener exactamente 11 dígitos' })
  ruc: string;
}
