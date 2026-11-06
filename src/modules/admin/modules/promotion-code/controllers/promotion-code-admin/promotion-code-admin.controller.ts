import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import {
  PromotionCodeCreateDto,
  PromotionCodeResultDto,
} from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/create.dto';
import { PromotionCodeDetailDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/find-one.dto';
import {
  PromotionCodeListDto,
  PromotionCodeListFiltersDto,
} from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/find-all.dto';
import { PromotionCodeUpdateDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/update.dto';
import { PromotionCodeService } from '@modules/admin/modules/promotion-code/promotion-code.service';

@ApiTags('promotionCodeAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/promotion-code')
export class PromotionCodeAdminController {
  constructor(private readonly promotionCodeService: PromotionCodeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List promotional codes for the admin panel' })
  @ApiResponse({ status: 200, type: PromotionCodeListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: PromotionCodeListFiltersDto) {
    return this.promotionCodeService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get promotional code details and redemptions' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PromotionCodeDetailDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionCodeService.findDetail(id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a promotional code' })
  @ApiResponse({ status: 201, type: PromotionCodeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Body() body: PromotionCodeCreateDto) {
    return this.promotionCodeService.create(body);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update or deactivate a promotional code' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PromotionCodeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: PromotionCodeUpdateDto) {
    return this.promotionCodeService.update(id, body);
  }
}
