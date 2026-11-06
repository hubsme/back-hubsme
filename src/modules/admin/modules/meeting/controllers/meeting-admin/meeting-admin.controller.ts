import { TraceNode } from '@erixcel/traceflow';
import { MeetingAdminGetRecordingsResultDto } from './dto/get-recordings.dto';
import { MeetingAdminFindAllResultDto } from './dto/find-all.dto';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import type { AdminAuthenticatedRequest } from '@modules/admin/modules/admin-auth/types/admin-auth-request.type';
import { MeetingAdminResultDto } from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/find-one.dto';
import {
  MeetingConsultantPayoutFiltersDto,
  MeetingConsultantPayoutListDto,
} from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/find-all-payouts.dto';
import {
  MeetingConsultantPayoutMarkPaidMultipartDto,
  MeetingConsultantPayoutResultDto,
} from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/mark-payout-paid.dto';
import { MeetingRecordingDto } from '@modules/admin/modules/meeting/dto/get-recordings.dto';
import { MeetingRescheduleTraceabilityDto } from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/get-payout-traceability.dto';
import { MeetingListDto, MeetingListFiltersDto } from '@modules/admin/modules/meeting/dto/find-all.dto';
import { MeetingConsultantPayoutService } from '@modules/admin/modules/meeting/services/meeting-consultant-payout.service';
import { meetingPayoutEvidenceUploadOptions } from '@modules/admin/modules/meeting/config/meeting-consultant-payout-upload.config';
import { MeetingService } from '@modules/admin/modules/meeting/meeting.service';

@ApiTags('meetingAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/meeting')
export class MeetingAdminController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly meetingConsultantPayoutService: MeetingConsultantPayoutService,
  ) {}

  @Get('payout/find-all')
  @ApiOperation({ summary: 'List consultant payouts generated from consultation meetings' })
  @ApiResponse({ status: 200, type: MeetingConsultantPayoutListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAllPayouts', type: 'controller' })
  findAllPayouts(@Query() filters: MeetingConsultantPayoutFiltersDto) {
    return this.meetingConsultantPayoutService.findAllPaginated(filters);
  }

  @Get('payout/:id/traceability')
  @ApiOperation({ summary: 'Get full reschedule and payment traceability for a consultant payout' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingRescheduleTraceabilityDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'getPayoutTraceability', type: 'controller' })
  getPayoutTraceability(@Param('id', ParseIntPipe) id: number) {
    return this.meetingConsultantPayoutService.getTraceability(id);
  }

  @Post('payout/:id/mark-paid')
  @ApiOperation({ summary: 'Register a manual consultant payout with its evidence' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: MeetingConsultantPayoutResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @UseInterceptors(FileInterceptor('evidence', meetingPayoutEvidenceUploadOptions))
  @TraceNode({ name: 'markPayoutPaid', type: 'controller' })
  markPayoutPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MeetingConsultantPayoutMarkPaidMultipartDto,
    @UploadedFile() evidence: Express.Multer.File | undefined,
    @Request() request: AdminAuthenticatedRequest,
  ) {
    return this.meetingConsultantPayoutService.markPaid(id, body, evidence, request.admin.username);
  }

  @Get('find-all')
  @ApiOperation({ summary: 'List meetings for the internal admin panel' })
  @ApiResponse({ status: 200, type: MeetingAdminFindAllResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: MeetingListFiltersDto) {
    return this.meetingService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a meeting for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingAdminResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.meetingService.findOneForAdmin(id);
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'List Microsoft Graph recordings for a meeting in the backoffice' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: [MeetingAdminGetRecordingsResultDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'getRecordings', type: 'controller' })
  getRecordings(@Param('id', ParseIntPipe) id: number) {
    return this.meetingService.listMeetingRecordings(id);
  }
}
