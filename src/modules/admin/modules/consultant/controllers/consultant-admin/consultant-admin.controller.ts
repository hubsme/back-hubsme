import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { ConsultantAdminRemoveResultDto } from './dto/remove.dto';
import { ConsultantAdminSetActiveResultDto } from './dto/set-active.dto';
import { ConsultantAdminFindOneResultDto } from './dto/find-one.dto';
import { ConsultantAdminFindAllResultDto } from './dto/find-all.dto';
import { Body, Controller, Delete, Get, Param, Patch, StreamableFile, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import { ConsultantListDto, ConsultantListFiltersDto } from '@modules/admin/modules/consultant/dto/find-all.dto';
import { ConsultantResultDto } from '@modules/admin/modules/consultant/dto/find-one.dto';
import { ConsultantApprovalDto } from '@modules/admin/modules/consultant/controllers/consultant-admin/dto/approve.dto';
import { ConsultantActiveDto } from '@modules/admin/modules/consultant/dto/set-active.dto';
import { ConsultantService } from '@modules/admin/modules/consultant/consultant.service';
import { ConsultantMercadoPagoAdminDto } from '@modules/admin/modules/consultant/controllers/consultant-admin/dto/mercado-pago.dto';
import {
  ConsultantMercadoPagoFinancialDownloadPendingDto,
  ConsultantMercadoPagoFinancialDownloadQueryDto,
} from '@modules/admin/modules/consultant/controllers/consultant-admin/dto/mercado-pago-financial-download.dto';
import { ConsultantMercadoPagoFinancialAdminDto } from '@modules/admin/modules/consultant/controllers/consultant-admin/dto/mercado-pago-financial.dto';

@ApiTags('consultantAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/consultant')
export class ConsultantAdminController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List consultants for the internal admin panel' })
  @ApiResponse({ status: 200, type: ConsultantAdminFindAllResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant profile for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAdminFindOneResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultantService.findOne(id);
  }

  @Get('mercado-pago/:id')
  @ApiOperation({ summary: 'Get Mercado Pago account details for a consultant in the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantMercadoPagoAdminDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'mercadoPago', type: 'controller' })
  mercadoPago(@Param('id', ParseIntPipe) id: number) {
    return this.consultantService.findMercadoPagoDetails(id);
  }

  @Get('mercado-pago/:id/financial')
  @ApiOperation({ summary: 'Get a consultant Mercado Pago financial report status in the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantMercadoPagoFinancialAdminDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'mercadoPagoFinancial', type: 'controller' })
  mercadoPagoFinancial(@Param('id', ParseIntPipe) id: number) {
    return this.consultantService.findMercadoPagoFinancialDetails(id);
  }

  @Get('mercado-pago/:id/financial/download')
  @ApiOperation({ summary: 'Download the latest consultant Mercado Pago financial report' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiProduces('text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json')
  @ApiResponse({ status: 200, description: 'Downloads the report or returns its generation status.' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'mercadoPagoFinancialDownload', type: 'controller' })
  async mercadoPagoFinancialDownload(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ConsultantMercadoPagoFinancialDownloadQueryDto,
  ): Promise<StreamableFile | ConsultantMercadoPagoFinancialDownloadPendingDto> {
    return this.consultantService.downloadMercadoPagoFinancialResponse(id, query.taskId);
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Approve or withdraw a consultant approval' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'approve', type: 'controller' })
  approve(@Param('id', ParseIntPipe) id: number, @Body() data: ConsultantApprovalDto) {
    return this.consultantService.setValidation(id, data);
  }

  @Patch('active/:id')
  @ApiOperation({ summary: 'Activate or deactivate a consultant' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAdminSetActiveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'setActive', type: 'controller' })
  setActive(@Param('id', ParseIntPipe) id: number, @Body() data: ConsultantActiveDto) {
    return this.consultantService.setActive(id, data);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant from the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAdminRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.consultantService.delete(id);
  }
}
