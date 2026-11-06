import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class DniVerificationResultDto {
  @ApiProperty({ description: 'Indica si todos los datos enviados coinciden' })
  verified: boolean;

  @ApiProperty({ description: 'Indica si PeruDevs encontró un registro para el DNI' })
  providerFound: boolean;

  @ApiProperty({ type: () => DniVerificationMatchesDto })
  matches: DniVerificationMatchesDto;

  @ApiProperty({
    type: () => DniVerificationIdentityDto,
    nullable: true,
    description: 'Datos devueltos por el proveedor para conservarlos internamente al crear la cuenta',
  })
  identity: DniVerificationIdentityDto | null;

  @ApiProperty({ example: 'Los datos coinciden con el registro consultado.' })
  message: string;
}

@Trace({ type: 'validation' })
export class DniVerificationDto {
  @ApiProperty({ example: '72750623', description: 'Número de DNI peruano de 8 dígitos' })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'documentNumber debe contener exactamente 8 dígitos' })
  documentNumber: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  paternalLastName: string;

  @ApiProperty({ example: 'Gómez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  maternalLastName: string;

  @ApiProperty({ example: '1990-05-21', description: 'Fecha en formato ISO: YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birthDate debe tener el formato YYYY-MM-DD' })
  birthDate: string;
}

export type PeruDevsDniResult = {
  id: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo: string;
  genero: string;
  fecha_nacimiento: string;
  codigo_verificacion: string;
};

export type PeruDevsDniResponse = {
  estado: boolean;
  mensaje: string;
  resultado?: PeruDevsDniResult | null;
};

export type PeruDevsRucResult = {
  id: string;
  razon_social: string;
  condicion: string;
  nombre_comercial: string;
  tipo: string;
  fecha_inscripcion: string;
  estado: string;
  direccion: string;
  sistema_emision: string;
  actividad_exterior: string;
  sistema_contabilidad: string;
  fecha_emision_electronica: string;
  fecha_ple: string;
  oficio: string;
  actividades_economicas: string[];
  comprobante_pago: string[];
  sistema_emision_electronica: string[];
  padrones: string[];
  departamento: string;
  provincia: string;
  distrito: string;
  representantes_legales: string[];
};

export type PeruDevsRucResponse = {
  estado: boolean;
  mensaje: string;
  resultado?: PeruDevsRucResult | null;
};
