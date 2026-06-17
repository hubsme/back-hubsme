import { ApiProperty } from '@nestjs/swagger';

export class ConsultantGoogleCalendarStatusDto {
  @ApiProperty({ example: true })
  connected: boolean;

  @ApiProperty({ example: 'consultor@gmail.com', nullable: true })
  googleEmail: string | null;

  @ApiProperty({ example: 'primary', nullable: true })
  googleCalendarId: string | null;

  @ApiProperty({ example: '2026-06-11T15:00:00.000Z', nullable: true })
  connectedAt: Date | null;
}
