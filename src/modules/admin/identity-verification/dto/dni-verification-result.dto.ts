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

export class DniVerificationIdentityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellido_paterno: string;

  @ApiProperty()
  apellido_materno: string;

  @ApiProperty()
  nombre_completo: string;

  @ApiProperty()
  genero: string;

  @ApiProperty()
  fecha_nacimiento: string;

  @ApiProperty()
  codigo_verificacion: string;
}

export class DniVerificationResultDto {
  @ApiProperty({ description: 'Indica si todos los datos enviados coinciden' })
  verified: boolean;

  @ApiProperty({ description: 'Indica si PeruDevs encontró un registro para el DNI' })
  providerFound: boolean;

  @ApiProperty({ type: DniVerificationMatchesDto })
  matches: DniVerificationMatchesDto;

  @ApiProperty({
    type: DniVerificationIdentityDto,
    nullable: true,
    description: 'Datos devueltos por el proveedor para conservarlos internamente al crear la cuenta',
  })
  identity: DniVerificationIdentityDto | null;

  @ApiProperty({ example: 'Los datos coinciden con el registro consultado.' })
  message: string;
}
