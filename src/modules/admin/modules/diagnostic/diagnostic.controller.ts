import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { DiagnosticRemoveResultDto } from './dto/remove.dto';
import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { DiagnosticGenerateDto } from '@modules/admin/modules/diagnostic/dto/generate.dto';
import { DiagnosticListDto, DiagnosticListFiltersDto } from '@modules/admin/modules/diagnostic/dto/find-all.dto';
import { DiagnosticResultDto } from '@modules/admin/modules/diagnostic/dto/find-one.dto';
import { DiagnosticService } from '@modules/admin/modules/diagnostic/diagnostic.service';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';

@ApiTags('diagnostic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/diagnostic')
export class DiagnosticController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all diagnostics paginated' })
  @ApiResponse({ status: 200, type: DiagnosticListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Request() req: AuthenticatedRequest, @Query() filters: DiagnosticListFiltersDto) {
    return this.diagnosticService.findAllPaginated(filters, req.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a diagnostic by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.diagnosticService.findOneForUser(id, req.user);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate and persist a PYME diagnostic' })
  @ApiResponse({ status: 200, type: DiagnosticResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'generate', type: 'controller' })
  generate(@Request() req: AuthenticatedRequest, @Body() generateDto: DiagnosticGenerateDto) {
    return this.diagnosticService.generateForUser(generateDto, req.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a diagnostic' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.diagnosticService.deleteForUser(id, req.user);
  }
}
