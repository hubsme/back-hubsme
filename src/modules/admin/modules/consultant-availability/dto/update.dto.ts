import { Trace } from '@erixcel/traceflow';
import { PartialType } from '@nestjs/swagger';
import { ConsultantAvailabilityCreateDto } from '@modules/admin/modules/consultant-availability/dto/create.dto';

@Trace({ type: 'validation' })
export class ConsultantAvailabilityUpdateDto extends PartialType(ConsultantAvailabilityCreateDto) {}
