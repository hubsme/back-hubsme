import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SERVICE_REQUEST_BUDGET_TYPES,
  SERVICE_REQUEST_CATEGORIES,
  SERVICE_REQUEST_WORK_MODALITIES,
  serviceRequestStatusEnum,
} from '@db/tables/service-request.table';
import type {
  ServiceRequestBudgetType,
  ServiceRequestCategory,
  ServiceRequestReferenceAttachment,
  ServiceRequestWorkModality,
} from '@db/tables/service-request.table';
import { MeetingResultDto } from '@modules/admin/meeting/dto/meeting-result.dto';

export class ServiceRequestMilestoneResultDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ example: '2026-09-15' })
  dueDate: string;
}

export class ServiceRequestReferenceAttachmentResultDto implements ServiceRequestReferenceAttachment {
  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;
}

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

  @ApiProperty({ type: [String] })
  initialMeetingProposedStartTimes: string[];

  @ApiPropertyOptional({ nullable: true, type: Date })
  initialMeetingStartTime: Date | null;

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

  @ApiPropertyOptional({ enum: SERVICE_REQUEST_CATEGORIES, nullable: true })
  category: ServiceRequestCategory | null;

  @ApiPropertyOptional({ nullable: true })
  subcategory: string | null;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ nullable: true })
  expectedOutcome: string | null;

  @ApiProperty()
  requirements: string;

  @ApiProperty({ type: [String] })
  deliverables: string[];

  @ApiPropertyOptional({ nullable: true })
  exclusions: string | null;

  @ApiProperty({ type: [String] })
  referenceUrls: string[];

  @ApiProperty({ type: [ServiceRequestReferenceAttachmentResultDto] })
  referenceAttachments: ServiceRequestReferenceAttachmentResultDto[];

  @ApiPropertyOptional({ enum: SERVICE_REQUEST_BUDGET_TYPES, nullable: true })
  budgetType: ServiceRequestBudgetType | null;

  @ApiPropertyOptional({ nullable: true })
  budgetMin: string | null;

  @ApiPropertyOptional({ nullable: true })
  budgetMax: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-30' })
  deadline: string | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedDuration: string | null;

  @ApiProperty({ enum: SERVICE_REQUEST_WORK_MODALITIES })
  workModality: ServiceRequestWorkModality;

  @ApiPropertyOptional({ nullable: true })
  workMethod: string | null;

  @ApiProperty({ type: [ServiceRequestMilestoneResultDto] })
  milestones: ServiceRequestMilestoneResultDto[];

  @ApiProperty({ type: [MeetingResultDto] })
  meetings: MeetingResultDto[];

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
