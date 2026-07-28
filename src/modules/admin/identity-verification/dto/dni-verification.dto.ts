import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

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
