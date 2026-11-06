import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { MeetingResultDto } from '@modules/admin/modules/meeting/dto/find-one.dto';

@Trace({ type: 'validation' })
export class MeetingAdminResultDto extends MeetingResultDto {
  @ApiProperty({
    nullable: true,
    description: 'Enlace original de Microsoft Teams, disponible únicamente en el backoffice',
  })
  meetingUrl: string | null;
}
