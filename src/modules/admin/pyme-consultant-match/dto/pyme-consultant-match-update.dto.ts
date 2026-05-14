import { PartialType } from '@nestjs/swagger';
import { PymeConsultantMatchCreateDto } from './pyme-consultant-match-create.dto';

export class PymeConsultantMatchUpdateDto extends PartialType(PymeConsultantMatchCreateDto) {}
