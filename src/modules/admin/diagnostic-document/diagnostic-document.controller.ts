import { Controller, Delete, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { DiagnosticDocumentListDto, DiagnosticDocumentListFiltersDto } from './dto/diagnostic-document-list.dto';
import { DiagnosticDocumentResultDto } from './dto/diagnostic-document-result.dto';
import { DiagnosticDocumentService } from './diagnostic-document.service';
import type { AuthenticatedRequest } from '@modules/auth/authenticated-user.type';

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
  findAll(@Request() req: AuthenticatedRequest, @Query() filters: DiagnosticDocumentListFiltersDto) {
    return this.diagnosticDocumentService.findAllPaginated(filters, req.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a diagnostic document by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.diagnosticDocumentService.findOneForUser(+id, req.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a diagnostic document' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.diagnosticDocumentService.deleteForUser(+id, req.user);
  }
}
