import { Body, Controller, Delete, Get, Param, Patch, StreamableFile, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { ConsultantListDto, ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantResultDto } from './dto/consultant-result.dto';
import { ConsultantApprovalDto } from './dto/consultant-approval.dto';
import { ConsultantActiveDto } from './dto/consultant-active.dto';
import { ConsultantService } from './consultant.service';
import {
  ConsultantMercadoPagoAdminDto,
  ConsultantMercadoPagoFinancialDownloadPendingDto,
  ConsultantMercadoPagoFinancialDownloadQueryDto,
  ConsultantMercadoPagoFinancialAdminDto,
} from './dto/consultant-mercado-pago.dto';

@ApiTags('consultantAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/consultant')
export class ConsultantAdminController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List consultants for the internal admin panel' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant profile for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(+id);
  }

  @Get('mercado-pago/:id')
  @ApiOperation({ summary: 'Get Mercado Pago account details for a consultant in the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantMercadoPagoAdminDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  mercadoPago(@Param('id') id: string) {
    return this.consultantService.findMercadoPagoDetails(+id);
  }

  @Get('mercado-pago/:id/financial')
  @ApiOperation({ summary: 'Get a consultant Mercado Pago financial report status in the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantMercadoPagoFinancialAdminDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  mercadoPagoFinancial(@Param('id') id: string) {
    return this.consultantService.findMercadoPagoFinancialDetails(+id);
  }

  @Get('mercado-pago/:id/financial/download')
  @ApiOperation({ summary: 'Download the latest consultant Mercado Pago financial report' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiProduces('text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json')
  @ApiResponse({ status: 200, description: 'Downloads the report or returns its generation status.' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async mercadoPagoFinancialDownload(
    @Param('id') id: string,
    @Query() query: ConsultantMercadoPagoFinancialDownloadQueryDto,
  ): Promise<StreamableFile | ConsultantMercadoPagoFinancialDownloadPendingDto> {
    const result = await this.consultantService.downloadMercadoPagoFinancialReport(+id, query.taskId);

    if (result.kind === 'processing') {
      return {
        status: 'processing',
        taskId: result.taskId,
        message: result.message,
      };
    }

    const safeFileName = result.fileName.replace(/[\r\n"]/g, '_');
    return new StreamableFile(result.buffer, {
      type: result.contentType,
      disposition: `attachment; filename="${safeFileName}"`,
    });
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Approve or withdraw a consultant approval' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  approve(@Param('id') id: string, @Body() data: ConsultantApprovalDto) {
    return this.consultantService.setValidation(+id, data);
  }

  @Patch('active/:id')
  @ApiOperation({ summary: 'Activate or deactivate a consultant' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  setActive(@Param('id') id: string, @Body() data: ConsultantActiveDto) {
    return this.consultantService.setActive(+id, data);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant from the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.consultantService.delete(+id);
  }
}
