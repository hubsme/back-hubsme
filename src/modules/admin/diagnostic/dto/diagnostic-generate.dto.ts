import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional } from 'class-validator';

export class DiagnosticGenerateDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiPropertyOptional({ type: Object, example: { name: 'Textiles del Sur SAC', sector: 'Manufactura' } })
  @IsObject()
  @IsOptional()
  pymeData?: Record<string, unknown>;

  @ApiProperty({ type: Object, example: { revenue: '500000', techLevel: 6, challenges: 'Falta de liquidez' } })
  @IsObject()
  responses: Record<string, unknown>;
}
