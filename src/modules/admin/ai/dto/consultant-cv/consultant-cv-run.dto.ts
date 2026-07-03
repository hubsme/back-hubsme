import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConsultantCvRunDto {
  @ApiProperty({
    example: 'Carlos Mendoza Rivas\nConsultor financiero y tributario para PYMES...',
    description: 'Texto extraido del PDF del CV en el frontend',
  })
  @IsString()
  @MinLength(40)
  text: string;

  @ApiPropertyOptional({ description: 'Prompt opcional para ajustar la extraccion del CV' })
  @IsString()
  @IsOptional()
  prompt?: string;
}
