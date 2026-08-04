import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ServiceRequestDraftDto } from './service-request-draft.dto';

export class ServiceConsultantMatchRunDto {
  @ApiProperty({ type: ServiceRequestDraftDto })
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft: ServiceRequestDraftDto;
}
