import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ConsultantActiveDto {
  @ApiProperty({
    enum: ['true', 'false'],
    description: 'Estado de disponibilidad del consultor',
  })
  @IsIn(['true', 'false'])
  active: 'true' | 'false';
}
