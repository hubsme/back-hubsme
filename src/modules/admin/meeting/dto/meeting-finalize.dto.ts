import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class MeetingFinalizeTaskDto {
  @ApiProperty({ example: 'Preparar propuesta de optimizacion' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Detallar alcance, tiempos y siguientes pasos.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], example: 'consultor' })
  @IsIn(['pyme', 'consultor'])
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['alta', 'media', 'baja'], example: 'media' })
  @IsIn(['alta', 'media', 'baja'])
  priority: 'alta' | 'media' | 'baja';

  @ApiProperty({ required: false, example: '2026-05-23T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class MeetingFinalizeDto {
  @ApiProperty({
    description: 'Acta completa en formato Markdown.',
    example:
      '## Resumen\nSe reviso el estado actual del negocio.\n\n## Acuerdos\n- El consultor preparara una propuesta.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [MeetingFinalizeTaskDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingFinalizeTaskDto)
  tasks?: MeetingFinalizeTaskDto[];
}
