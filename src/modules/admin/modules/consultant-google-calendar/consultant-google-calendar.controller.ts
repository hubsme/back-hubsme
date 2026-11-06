import { TraceNode } from '@erixcel/traceflow';
import { ConsultantGoogleCalendarDisconnectResultDto } from './dto/disconnect.dto';
import { Controller, Delete, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ConsultantGoogleCalendarService } from '@modules/admin/modules/consultant-google-calendar/consultant-google-calendar.service';
import {
  ConsultantGoogleCalendarAuthUrlDto,
  ConsultantGoogleCalendarAuthUrlResponseDto,
} from '@modules/admin/modules/consultant-google-calendar/dto/auth-url.dto';
import { ConsultantGoogleCalendarCallbackDto } from '@modules/admin/modules/consultant-google-calendar/dto/callback.dto';
import {
  ConsultantGoogleCalendarBusyMonthDto,
  ConsultantGoogleCalendarBusyMonthResponseDto,
} from '@modules/admin/modules/consultant-google-calendar/dto/busy-month.dto';
import { ConsultantGoogleCalendarStatusDto } from '@modules/admin/modules/consultant-google-calendar/dto/status.dto';

@ApiTags('consultantGoogleCalendar')
@Controller('admin/consultant-google-calendar')
export class ConsultantGoogleCalendarController {
  constructor(private readonly googleCalendarService: ConsultantGoogleCalendarService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar OAuth URL for a consultant' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarAuthUrlResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'authUrl', type: 'controller' })
  authUrl(@Query() query: ConsultantGoogleCalendarAuthUrlDto) {
    return this.googleCalendarService.getAuthUrl(query);
  }

  @Get('callback')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Google Calendar OAuth callback for consultant connection' })
  @ApiResponse({ status: 200, description: 'HTML response that posts the connection result to the opener window' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'callback', type: 'controller' })
  callback(@Query() query: ConsultantGoogleCalendarCallbackDto) {
    return this.googleCalendarService.handleCallback(query);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consultant Google Calendar connection status' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarStatusDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'status', type: 'controller' })
  status(@Query() query: ConsultantGoogleCalendarAuthUrlDto) {
    return this.googleCalendarService.getStatus(query.consultantId);
  }

  @Get('busy-month')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get busy events from consultant Google Calendar for a month' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarBusyMonthResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'busyMonth', type: 'controller' })
  busyMonth(@Query() query: ConsultantGoogleCalendarBusyMonthDto) {
    return this.googleCalendarService.findBusyMonth(query);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect consultant Google Calendar account' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarDisconnectResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'disconnect', type: 'controller' })
  disconnect(@Query() query: ConsultantGoogleCalendarAuthUrlDto) {
    return this.googleCalendarService.disconnect(query.consultantId);
  }
}
