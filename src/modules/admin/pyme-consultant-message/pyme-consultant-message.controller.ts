import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { PymeConsultantMessageCreateDto } from './dto/pyme-consultant-message-create.dto';
import { PymeConsultantMessageListDto, PymeConsultantMessageListFiltersDto } from './dto/pyme-consultant-message-list.dto';
import { PymeConsultantMessageResultDto } from './dto/pyme-consultant-message-result.dto';
import { PymeConsultantMessageService } from './pyme-consultant-message.service';

@ApiTags('pymeConsultantMessage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/pyme-consultant-message')
export class PymeConsultantMessageController {
  constructor(private readonly messageService: PymeConsultantMessageService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get messages by accepted PYME and consultant match' })
  @ApiResponse({ status: 200, type: PymeConsultantMessageListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: PymeConsultantMessageListFiltersDto) {
    return this.messageService.findAll(filters);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a message in an accepted PYME and consultant match' })
  @ApiResponse({ status: 200, type: PymeConsultantMessageResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createMessageDto: PymeConsultantMessageCreateDto) {
    return this.messageService.create(createMessageDto);
  }
}
