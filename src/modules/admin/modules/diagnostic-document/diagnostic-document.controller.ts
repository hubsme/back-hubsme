import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { DiagnosticDocumentRemoveResultDto } from './dto/remove.dto';
import { Controller, Delete, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import {
  DiagnosticDocumentListDto,
  DiagnosticDocumentListFiltersDto,
} from '@modules/admin/modules/diagnostic-document/dto/find-all.dto';
import { DiagnosticDocumentResultDto } from '@modules/admin/modules/diagnostic-document/dto/find-one.dto';
import { DiagnosticDocumentService } from '@modules/admin/modules/diagnostic-document/diagnostic-document.service';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';

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
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Request() req: AuthenticatedRequest, @Query() filters: DiagnosticDocumentListFiltersDto) {
    return this.diagnosticDocumentService.findAllPaginated(filters, req.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a diagnostic document by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.diagnosticDocumentService.findOneForUser(id, req.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a diagnostic document' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticDocumentRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.diagnosticDocumentService.deleteForUser(id, req.user);
  }
}
