import { Trace } from '@erixcel/traceflow';
import { PartialType } from '@nestjs/swagger';
import { ConsultantCreateDto } from '@modules/admin/modules/consultant/dto/create.dto';

@Trace({ type: 'validation' })
export class ConsultantUpdateDto extends PartialType(ConsultantCreateDto) {}
