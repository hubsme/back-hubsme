import { PartialType } from '@nestjs/swagger';
import { ConsultantCreateDto } from './consultant-create.dto';

export class ConsultantUpdateDto extends PartialType(ConsultantCreateDto) {}
