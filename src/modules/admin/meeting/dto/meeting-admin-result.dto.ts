import { ApiProperty } from '@nestjs/swagger';
import { MeetingResultDto } from './meeting-result.dto';

export class MeetingAdminResultDto extends MeetingResultDto {
  @ApiProperty({
    nullable: true,
    description: 'Enlace original de Microsoft Teams, disponible únicamente en el backoffice',
  })
  meetingUrl: string | null;
}
