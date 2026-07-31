import { ApiProperty } from '@nestjs/swagger';

export class RucVerificationResultDto {
  @ApiProperty({ description: 'Indica si el RUC existe en el registro consultado' })
  verified: boolean;

  @ApiProperty({ description: 'Indica si PeruDevs encontró información para el RUC' })
  providerFound: boolean;

  @ApiProperty({
    nullable: true,
    description: 'Nombre comercial asociado al RUC cuando existe en el registro',
    example: 'Textiles del Sur SAC',
  })
  nombreComercial: string | null;

  @ApiProperty({ example: 'El RUC existe en el registro consultado.' })
  message: string;
}
