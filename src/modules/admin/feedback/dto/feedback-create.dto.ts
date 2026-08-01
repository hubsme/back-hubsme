import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class FeedbackCreateDto {
  @ApiProperty({ example: 'No puedo visualizar el acta de mi reunión', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: 'Al ingresar al detalle aparece una pantalla vacía.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;
}

export class FeedbackCreateMultipartDto extends FeedbackCreateDto {
  @ApiPropertyOptional({
    description: 'Hasta 5 imágenes JPG, PNG, WEBP, HEIC o HEIF de máximo 8 MB cada una',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  images?: string[];
}
