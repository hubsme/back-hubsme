import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MeetingTeamsJoinDto {
  @ApiPropertyOptional({ example: 'Maria Torres' })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  displayName?: string;
}

export class MeetingTeamsJoinResponseDto {
  @ApiProperty({ example: 12 })
  meetingId: number;

  @ApiProperty({ example: 'https://teams.microsoft.com/l/meetup-join/...' })
  meetingUrl: string;

  @ApiProperty({ example: '8:acs:00000000-0000-0000-0000-000000000000_00000000-0000-0000-0000-000000000000' })
  acsUserId: string;

  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...' })
  token: string;

  @ApiProperty({ example: '2026-05-19T18:30:00.000Z' })
  expiresOn: Date;

  @ApiPropertyOptional({ example: 'Maria Torres' })
  displayName?: string;
}
