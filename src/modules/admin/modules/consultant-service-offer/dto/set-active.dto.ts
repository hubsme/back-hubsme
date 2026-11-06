import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

@Trace({ type: 'validation' })
export class ConsultantServiceOfferActiveDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
