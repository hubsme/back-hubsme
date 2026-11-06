import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';

@Trace({ type: 'validation' })
export class PlanResultDto {
  @ApiProperty({ enum: ['free', 'basic', 'pro', 'expert'] })
  id: 'free' | 'basic' | 'pro' | 'expert';

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  features: string[];
}
