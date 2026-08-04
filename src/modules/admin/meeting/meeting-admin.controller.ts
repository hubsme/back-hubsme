import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { MeetingAdminResultDto } from './dto/meeting-admin-result.dto';
import { MeetingListDto, MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingService } from './meeting.service';

@ApiTags('meetingAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/meeting')
export class MeetingAdminController {
  constructor(private readonly meetingService: MeetingService) {}

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
}
