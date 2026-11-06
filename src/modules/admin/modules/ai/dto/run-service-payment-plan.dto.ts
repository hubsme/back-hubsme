import { Trace } from '@erixcel/traceflow';
import { ServiceRequestPaymentPlanDto } from '@modules/admin/modules/service-request/dto/create.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ServiceRequestDraftDto } from '@modules/admin/modules/ai/dto/run-hubsme-ai.dto';

@Trace({ type: 'validation' })
export class ServicePaymentPlanResultDto extends ServiceRequestPaymentPlanDto {}

@Trace({ type: 'validation' })
export class ServicePaymentPlanRunDto {
  @ApiProperty({ type: () => ServiceRequestDraftDto })
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft: ServiceRequestDraftDto;
}
