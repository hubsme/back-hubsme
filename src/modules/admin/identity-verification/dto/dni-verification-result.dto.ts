import { ApiProperty } from '@nestjs/swagger';

export class DniVerificationMatchesDto {
  @ApiProperty({ description: 'Coincide el número de DNI consultado con el registro devuelto' })
  documentNumber: boolean;

  @ApiProperty()
  firstName: boolean;

  @ApiProperty()
  paternalLastName: boolean;

  @ApiProperty()
  maternalLastName: boolean;

  @ApiProperty()
  birthDate: boolean;
}

export class DniVerificationResultDto {
  @ApiProperty({ description: 'Indica si todos los datos enviados coinciden' })
  verified: boolean;

  @ApiProperty({ description: 'Indica si PeruDevs encontró un registro para el DNI' })
  providerFound: boolean;

  @ApiProperty({ type: DniVerificationMatchesDto })
  matches: DniVerificationMatchesDto;

  @ApiProperty({ example: 'Los datos coinciden con el registro consultado.' })
  message: string;
}
