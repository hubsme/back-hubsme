import { PartialType } from '@nestjs/swagger';
import { ConsultantAvailabilityCreateDto } from './consultant-availability-create.dto';

export class ConsultantAvailabilityUpdateDto extends PartialType(ConsultantAvailabilityCreateDto) {}
