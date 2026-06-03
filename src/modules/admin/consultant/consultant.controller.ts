import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ConsultantCreateDto } from './dto/consultant-create.dto';
import { ConsultantPymeActionDto, ConsultantPymeMessageActionDto } from './dto/consultant-pyme-action.dto';
import { ConsultantPymeListFiltersDto, ConsultantPymeMessageListFiltersDto } from './dto/consultant-pyme-list.dto';
import { ConsultantListDto, ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantResultDto } from './dto/consultant-result.dto';
import { ConsultantUpdateDto } from './dto/consultant-update.dto';
import { ConsultantService } from './consultant.service';
import { PymeConsultantMatchListDto, PymeConsultantMatchResultDto } from '@modules/admin/pyme/dto/pyme-consultant-match.dto';
import { PymeConsultantMessageListDto, PymeConsultantMessageResultDto } from '@modules/admin/pyme/dto/pyme-consultant-message.dto';

@ApiTags('consultant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/consultant')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all consultants paginated' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(+id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a consultant profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findByUser(@Param('userId') userId: string) {
    return this.consultantService.findByUserId(+userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new consultant profile' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createConsultantDto: ConsultantCreateDto) {
    return this.consultantService.create(createConsultantDto);
  }

  @Post('contact-pyme')
  @ApiOperation({ summary: 'Request contact with a PYME from a consultant' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  contactPyme(@Body() contactDto: ConsultantPymeActionDto) {
    return this.consultantService.contactPyme(contactDto);
  }

  @Get('pyme-contacts')
  @ApiOperation({ summary: 'Get PYME contacts for a consultant' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  pymeContacts(@Query() filters: ConsultantPymeListFiltersDto) {
    return this.consultantService.listPymeContacts(filters);
  }

  @Patch('accept-pyme-contact')
  @ApiOperation({ summary: 'Accept a PYME contact request from a consultant' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  acceptPymeContact(@Body() contactDto: ConsultantPymeActionDto) {
    return this.consultantService.acceptPymeContact(contactDto);
  }

  @Patch('reject-pyme-contact')
  @ApiOperation({ summary: 'Reject a PYME contact request from a consultant' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  rejectPymeContact(@Body() contactDto: ConsultantPymeActionDto) {
    return this.consultantService.rejectPymeContact(contactDto);
  }

  @Get('pyme-messages')
  @ApiOperation({ summary: 'Get messages with a PYME from a consultant' })
  @ApiResponse({ status: 200, type: PymeConsultantMessageListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  pymeMessages(@Query() filters: ConsultantPymeMessageListFiltersDto) {
    return this.consultantService.listPymeMessages(filters);
  }

  @Post('send-pyme-message')
  @ApiOperation({ summary: 'Send a message from a consultant to a PYME' })
  @ApiResponse({ status: 200, type: PymeConsultantMessageResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  sendPymeMessage(@Body() messageDto: ConsultantPymeMessageActionDto) {
    return this.consultantService.sendPymeMessage(messageDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a consultant profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updateConsultantDto: ConsultantUpdateDto) {
    return this.consultantService.update(+id, updateConsultantDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.consultantService.delete(+id);
  }
}
