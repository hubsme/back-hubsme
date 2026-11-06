import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

@Trace({ type: 'validation' })
export class ConsultantActiveDto {
  @ApiProperty({
    enum: ['true', 'false'],
    description: 'Estado de disponibilidad del consultor',
  })
  @IsIn(['true', 'false'])
  active: 'true' | 'false';
}
