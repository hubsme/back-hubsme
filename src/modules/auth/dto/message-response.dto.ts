import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Operación realizada con éxito', description: 'Mensaje de respuesta' })
  message: string;
}
