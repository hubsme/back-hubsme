import { PartialType } from '@nestjs/swagger';
import { PymeCreateDto } from './pyme-create.dto';

export class PymeUpdateDto extends PartialType(PymeCreateDto) {}
