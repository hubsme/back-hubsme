import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import {
  DiagnosticDocumentListDto,
  DiagnosticDocumentListFiltersDto,
} from './dto/diagnostic-document-list.dto';
import { DiagnosticDocumentResultDto } from './dto/diagnostic-document-result.dto';
import { DiagnosticDocumentService } from './diagnostic-document.service';

@ApiTags('diagnosticDocument')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/diagnostic-document')
export class DiagnosticDocumentController {
  constructor(private readonly diagnosticDocumentService: DiagnosticDocumentService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all diagnostic documents paginated' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: DiagnosticDocumentListFiltersDto) {
    return this.diagnosticDocumentService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a diagnostic document by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.diagnosticDocumentService.findOne(+id);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a diagnostic document' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.diagnosticDocumentService.delete(+id);
  }
}
