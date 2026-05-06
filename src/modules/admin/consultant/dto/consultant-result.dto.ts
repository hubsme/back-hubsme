import { ApiProperty } from '@nestjs/swagger';

export class ConsultantResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiProperty({ type: [String] })
  sectors: string[];

  @ApiProperty()
  pricePerHour: string;

  @ApiProperty()
  rating: string;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ enum: ['true', 'false'] })
  active: string;

  @ApiProperty({ enum: ['true', 'false'] })
  validated: string;
}
