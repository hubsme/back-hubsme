import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HubsmeAiRunDto {
  @ApiProperty({ description: 'Texto de la transcripción a procesar' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Instrucciones o prompt opcional para el modelo de IA',
  })
  @IsString()
  @IsOptional()
  prompt?: string;
}
