import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { DiagnosticGenerateDto } from './dto/diagnostic-generate.dto';
import { DiagnosticListDto, DiagnosticListFiltersDto } from './dto/diagnostic-list.dto';
import { DiagnosticResultDto } from './dto/diagnostic-result.dto';
import { DiagnosticService } from './diagnostic.service';
import type { AuthenticatedRequest } from '@modules/auth/authenticated-user.type';

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
  findAll(@Request() req: AuthenticatedRequest, @Query() filters: DiagnosticListFiltersDto) {
    return this.diagnosticService.findAllPaginated(filters, req.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a diagnostic by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.diagnosticService.findOneForUser(+id, req.user);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate and persist a PYME diagnostic' })
  @ApiResponse({ status: 200, type: DiagnosticResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  generate(@Request() req: AuthenticatedRequest, @Body() generateDto: DiagnosticGenerateDto) {
    return this.diagnosticService.generateForUser(generateDto, req.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a diagnostic' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: DiagnosticResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.diagnosticService.deleteForUser(+id, req.user);
  }
}
