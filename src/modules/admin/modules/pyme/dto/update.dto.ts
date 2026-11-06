import { Trace } from '@erixcel/traceflow';
import { PartialType } from '@nestjs/swagger';
import { PymeConsultantMatchCreateDto, PymeCreateDto } from '@modules/admin/modules/pyme/dto/create.dto';

@Trace({ type: 'validation' })
export class PymeConsultantMatchUpdateDto extends PartialType(PymeConsultantMatchCreateDto) {}

@Trace({ type: 'validation' })
export class PymeUpdateDto extends PartialType(PymeCreateDto) {}
