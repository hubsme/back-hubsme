import { ApiProperty } from '@nestjs/swagger';

export class PymeConsultantMessageResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  matchId: number;

  @ApiProperty()
  senderId: number;

  @ApiProperty({ nullable: true })
  senderName: string | null;

  @ApiProperty({ enum: ['admin', 'pyme', 'consultor'], nullable: true })
  senderRole: 'admin' | 'pyme' | 'consultor' | null;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  readAt: Date | null;
}
