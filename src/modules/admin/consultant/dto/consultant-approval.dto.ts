import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ConsultantApprovalDto {
  @ApiProperty({
    enum: ['true', 'false'],
    description: 'Estado de aprobación asignado manualmente por backoffice',
  })
  @IsIn(['true', 'false'])
  validated: 'true' | 'false';
}
