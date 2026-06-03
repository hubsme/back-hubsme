import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeConsultantActionDto, PymeConsultantMessageActionDto } from './dto/pyme-consultant-action.dto';
import { PymeConsultantListFiltersDto, PymeConsultantMessageListFiltersDto } from './dto/pyme-consultant-list.dto';
import { PymeListDto, PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeConsultantMatchListDto, PymeConsultantMatchResultDto } from './dto/pyme-consultant-match.dto';
import { PymeConsultantMessageListDto, PymeConsultantMessageResultDto } from './dto/pyme-consultant-message.dto';
import { PymeResultDto } from './dto/pyme-result.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';
import { PymeService } from './pyme.service';

@ApiTags('pyme')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/pyme')
export class PymeController {
  constructor(private readonly pymeService: PymeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all PYMEs paginated' })
  @ApiResponse({ status: 200, type: PymeListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: PymeListFiltersDto) {
    return this.pymeService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.pymeService.findOne(+id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a PYME profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findByUser(@Param('userId') userId: string) {
    return this.pymeService.findByUserId(+userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new PYME profile' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createPymeDto: PymeCreateDto) {
    return this.pymeService.create(createPymeDto);
  }

  @Post('contact-consultant')
  @ApiOperation({ summary: 'Request contact with a consultant from a PYME' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  contactConsultant(@Body() contactDto: PymeConsultantActionDto) {
    return this.pymeService.contactConsultant(contactDto);
  }

  @Get('consultant-contacts')
  @ApiOperation({ summary: 'Get consultant contacts for a PYME' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  consultantContacts(@Query() filters: PymeConsultantListFiltersDto) {
    return this.pymeService.listConsultantContacts(filters);
  }

  @Patch('accept-consultant-contact')
  @ApiOperation({ summary: 'Accept a consultant contact request from a PYME' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  acceptConsultantContact(@Body() contactDto: PymeConsultantActionDto) {
    return this.pymeService.acceptConsultantContact(contactDto);
  }

  @Patch('reject-consultant-contact')
  @ApiOperation({ summary: 'Reject a consultant contact request from a PYME' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  rejectConsultantContact(@Body() contactDto: PymeConsultantActionDto) {
    return this.pymeService.rejectConsultantContact(contactDto);
  }

  @Get('consultant-messages')
  @ApiOperation({ summary: 'Get messages with a consultant from a PYME' })
  @ApiResponse({ status: 200, type: PymeConsultantMessageListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  consultantMessages(@Query() filters: PymeConsultantMessageListFiltersDto) {
    return this.pymeService.listConsultantMessages(filters);
  }

  @Post('send-consultant-message')
  @ApiOperation({ summary: 'Send a message from a PYME to a consultant' })
  @ApiResponse({ status: 200, type: PymeConsultantMessageResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  sendConsultantMessage(@Body() messageDto: PymeConsultantMessageActionDto) {
    return this.pymeService.sendConsultantMessage(messageDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updatePymeDto: PymeUpdateDto) {
    return this.pymeService.update(+id, updatePymeDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.pymeService.delete(+id);
  }
}
