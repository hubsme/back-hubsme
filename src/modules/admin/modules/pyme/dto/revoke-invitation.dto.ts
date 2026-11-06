import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';

@Trace({ type: 'validation' })
export class MessageResultDto {
  @ApiProperty()
  message: string;
}
