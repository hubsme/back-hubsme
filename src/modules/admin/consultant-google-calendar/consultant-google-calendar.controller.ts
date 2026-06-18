import { Controller, Delete, Get, Header, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ConsultantGoogleCalendarService } from './consultant-google-calendar.service';
import {
  ConsultantGoogleCalendarAuthUrlDto,
  ConsultantGoogleCalendarAuthUrlResponseDto,
  ConsultantGoogleCalendarCallbackDto,
} from './dto/consultant-google-calendar-auth.dto';
import {
  ConsultantGoogleCalendarBusyMonthDto,
  ConsultantGoogleCalendarBusyMonthResponseDto,
} from './dto/consultant-google-calendar-busy.dto';
import { ConsultantGoogleCalendarStatusDto } from './dto/consultant-google-calendar-status.dto';

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
  authUrl(@Query() query: ConsultantGoogleCalendarAuthUrlDto) {
    return this.googleCalendarService.getAuthUrl(query);
  }

  @Get('callback')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Google Calendar OAuth callback for consultant connection' })
  @ApiResponse({ status: 200, description: 'HTML response that posts the connection result to the opener window' })
  callback(@Query() query: ConsultantGoogleCalendarCallbackDto) {
    return this.googleCalendarService.handleCallback(query);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consultant Google Calendar connection status' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarStatusDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  status(@Query() query: ConsultantGoogleCalendarAuthUrlDto) {
    return this.googleCalendarService.getStatus(query.consultantId);
  }

  @Get('busy-month')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get busy events from consultant Google Calendar for a month' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarBusyMonthResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  busyMonth(@Query() query: ConsultantGoogleCalendarBusyMonthDto) {
    return this.googleCalendarService.findBusyMonth(query);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect consultant Google Calendar account' })
  @ApiResponse({ status: 200, type: ConsultantGoogleCalendarStatusDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  disconnect(@Query() query: ConsultantGoogleCalendarAuthUrlDto) {
    return this.googleCalendarService.disconnect(query.consultantId);
  }
}
