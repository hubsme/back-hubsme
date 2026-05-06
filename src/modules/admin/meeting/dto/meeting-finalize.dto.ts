import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MeetingFinalizeDto {
  @ApiProperty({
    example:
      'Revisamos el embudo comercial, acordamos implementar CRM y preparar reporte financiero para la siguiente sesion.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
