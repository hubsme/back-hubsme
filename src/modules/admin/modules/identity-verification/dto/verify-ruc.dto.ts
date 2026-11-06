import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

@Trace({ type: 'validation' })
export class RucVerificationResultDto {
  @ApiProperty({ description: 'Indica si el RUC existe en el registro consultado' })
  verified: boolean;

  @ApiProperty({ description: 'Indica si PeruDevs encontró información para el RUC' })
  providerFound: boolean;

  @ApiProperty({
    nullable: true,
    description:
      'Nombre comercial asociado al RUC; usa la razón social cuando el proveedor no informa un nombre comercial',
    example: 'Textiles del Sur SAC',
  })
  nombreComercial: string | null;

  @ApiProperty({ example: 'El RUC existe en el registro consultado.' })
  message: string;
}

@Trace({ type: 'validation' })
export class RucVerificationDto {
  @ApiProperty({ example: '20123456789', description: 'Número de RUC peruano de 11 dígitos' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'ruc debe contener exactamente 11 dígitos' })
  ruc: string;
}
