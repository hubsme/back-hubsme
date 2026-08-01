import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class FeedbackReplyCreateDto {
  @ApiProperty({ example: 'Gracias por el reporte. Ya estamos revisándolo.', maxLength: 3000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(3000)
  message: string;
}
