import { PartialType } from '@nestjs/swagger';
import { MeetingCreateDto } from './meeting-create.dto';

export class MeetingUpdateDto extends PartialType(MeetingCreateDto) {}
