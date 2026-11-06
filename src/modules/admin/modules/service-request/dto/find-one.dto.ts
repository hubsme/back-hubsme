import { checkoutStatusEnum } from '@db/tables/checkout.table';
import {
  serviceRequestBudgetTypeEnum,
  serviceRequestCategoryEnum,
  serviceRequestWorkModalityEnum,
} from '@db/tables/service-request.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { serviceRequestStatusEnum } from '@db/tables/service-request.table';
import { MeetingResultDto } from '@modules/admin/modules/meeting/dto/find-one.dto';
import { ServiceRequestPaymentPlanDto } from '@modules/admin/modules/service-request/dto/create.dto';

@Trace({ type: 'validation' })
export class ServiceRequestPaymentScheduleItemDto {
  @ApiProperty({ minimum: 0 })
  installmentIndex: number;

  @ApiProperty()
  label: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  percentage: number;

  @ApiProperty({ enum: ['service_approval', 'milestone_completion', 'service_completion'] })
  trigger: 'service_approval' | 'milestone_completion' | 'service_completion';

  @ApiProperty({ minimum: 0 })
  milestoneIndex: number;

  @ApiPropertyOptional({ nullable: true })
  amount: string | null;

  @ApiProperty({ enum: ['not_started', ...checkoutStatusEnum.enumValues] })
  status: 'not_started' | (typeof checkoutStatusEnum.enumValues)[number];

  @ApiProperty()
  available: boolean;

  @ApiPropertyOptional({ nullable: true })
  availabilityMessage: string | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  paidAt: Date | null;
}

@Trace({ type: 'validation' })
export class ServiceRequestMilestoneResultDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ example: '2026-09-15' })
  dueDate: string;
}

@Trace({ type: 'validation' })
export class ServiceRequestReferenceAttachmentResultDto {
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

@Trace({ type: 'validation' })
export class ServiceRequestEvidenceAttachmentResultDto extends ServiceRequestReferenceAttachmentResultDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  milestoneIndex: number | null;

  @ApiProperty()
  uploadedAt: string;

  @ApiProperty()
  uploadedBy: number;

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  uploadedByRole: 'pyme' | 'consultor';
}

@Trace({ type: 'validation' })
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

  @ApiPropertyOptional({ nullable: true })
  serviceOfferId: number | null;

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

  @ApiPropertyOptional({ enum: serviceRequestCategoryEnum.enumValues, nullable: true })
  category: (typeof serviceRequestCategoryEnum.enumValues)[number] | null;

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

  @ApiProperty({ type: () => [ServiceRequestReferenceAttachmentResultDto] })
  referenceAttachments: ServiceRequestReferenceAttachmentResultDto[];

  @ApiProperty({ type: () => [ServiceRequestEvidenceAttachmentResultDto] })
  evidenceAttachments: ServiceRequestEvidenceAttachmentResultDto[];

  @ApiPropertyOptional({ enum: serviceRequestBudgetTypeEnum.enumValues, nullable: true })
  budgetType: (typeof serviceRequestBudgetTypeEnum.enumValues)[number] | null;

  @ApiPropertyOptional({ nullable: true })
  budgetMin: string | null;

  @ApiPropertyOptional({ nullable: true })
  budgetMax: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-30' })
  deadline: string | null;

  @ApiPropertyOptional({ nullable: true })
  estimatedDuration: string | null;

  @ApiProperty({ enum: serviceRequestWorkModalityEnum.enumValues })
  workModality: (typeof serviceRequestWorkModalityEnum.enumValues)[number];

  @ApiPropertyOptional({ nullable: true })
  workMethod: string | null;

  @ApiProperty({ type: () => [ServiceRequestMilestoneResultDto] })
  milestones: ServiceRequestMilestoneResultDto[];

  @ApiProperty({ type: () => ServiceRequestPaymentPlanDto })
  paymentPlan: ServiceRequestPaymentPlanDto;

  @ApiProperty({ type: () => [ServiceRequestPaymentScheduleItemDto] })
  paymentSchedule: ServiceRequestPaymentScheduleItemDto[];

  @ApiProperty({ type: () => [MeetingResultDto] })
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

  @ApiPropertyOptional({ nullable: true })
  completedAt: Date | null;
}
