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
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type { AdminAuthenticatedRequest } from '../admin-auth/admin-auth-request.type';
import { MeetingAdminResultDto } from './dto/meeting-admin-result.dto';
import {
  MeetingConsultantPayoutFiltersDto,
  MeetingConsultantPayoutListDto,
  MeetingConsultantPayoutMarkPaidMultipartDto,
  MeetingConsultantPayoutResultDto,
} from './dto/meeting-consultant-payout.dto';
import { MeetingRecordingDto } from './dto/meeting-recording.dto';
import { MeetingRescheduleTraceabilityDto } from './dto/meeting-reschedule-traceability.dto';
import { MeetingListDto, MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingConsultantPayoutService } from './meeting-consultant-payout.service';
import { meetingPayoutEvidenceUploadOptions } from './meeting-consultant-payout-upload.config';
import { MeetingService } from './meeting.service';

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
  findAllPayouts(@Query() filters: MeetingConsultantPayoutFiltersDto) {
    return this.meetingConsultantPayoutService.findAllPaginated(filters);
  }

  @Get('payout/:id/traceability')
  @ApiOperation({ summary: 'Get full reschedule and payment traceability for a consultant payout' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingRescheduleTraceabilityDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
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
  @ApiResponse({ status: 200, type: MeetingListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: MeetingListFiltersDto) {
    return this.meetingService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a meeting for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingAdminResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.meetingService.findOneForAdmin(+id);
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'List Microsoft Graph recordings for a meeting in the backoffice' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: [MeetingRecordingDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  getRecordings(@Param('id', ParseIntPipe) id: number) {
    return this.meetingService.listMeetingRecordings(id);
  }
}
