import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceConsultantMatchDto, ServiceRequestDraftDto } from '@modules/admin/modules/ai/dto/run-hubsme-ai.dto';

@Trace({ type: 'validation' })
export class ServiceConsultantMatchesResultDto {
  @ApiProperty({ type: () => [ServiceConsultantMatchDto], minItems: 3, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ServiceConsultantMatchDto)
  matches: ServiceConsultantMatchDto[];
}

@Trace({ type: 'validation' })
export class ServiceConsultantMatchRunDto {
  @ApiProperty({ type: () => ServiceRequestDraftDto })
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft: ServiceRequestDraftDto;
}
