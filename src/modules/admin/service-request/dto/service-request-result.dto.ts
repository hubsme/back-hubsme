import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { serviceRequestStatusEnum } from '@db/tables/service-request.table';

export class ServiceRequestResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ nullable: true })
  pymeName: string | null;

  @ApiProperty({ nullable: true })
  consultantName: string | null;

  @ApiPropertyOptional({ nullable: true })
  consultantHeadline: string | null;

  @ApiPropertyOptional({ nullable: true })
  consultantPhotoUrl: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  requirements: string;

  @ApiPropertyOptional({ nullable: true })
  details: string | null;

  @ApiProperty({ enum: serviceRequestStatusEnum.enumValues })
  status: (typeof serviceRequestStatusEnum.enumValues)[number];

  @ApiPropertyOptional({ nullable: true })
  proposedPrice: string | null;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ nullable: true })
  proposalMessage: string | null;

  @ApiPropertyOptional({ nullable: true })
  pymeDecisionMessage: string | null;

  @ApiPropertyOptional({ nullable: true })
  respondedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  decidedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt: Date | null;
}
