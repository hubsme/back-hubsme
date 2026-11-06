import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

@Trace({ type: 'validation' })
export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@hubsme.com', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;
}

@Trace({ type: 'validation' })
export class MessageResponseDto {
  @ApiProperty({ example: 'Operación realizada con éxito', description: 'Mensaje de respuesta' })
  message: string;
}
