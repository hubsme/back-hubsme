import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import {
  PromotionCodeCreateDto,
  PromotionCodeListDto,
  PromotionCodeListFiltersDto,
  PromotionCodeResultDto,
  PromotionCodeUpdateDto,
} from './dto/promotion-code.dto';
import { PromotionCodeService } from './promotion-code.service';

@ApiTags('promotionCodeAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/promotion-code')
export class PromotionCodeAdminController {
  constructor(private readonly promotionCodeService: PromotionCodeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List promotional codes for the admin panel' })
  @ApiResponse({ status: 200, type: PromotionCodeListDto })
  findAll(@Query() filters: PromotionCodeListFiltersDto) {
    return this.promotionCodeService.findAllPaginated(filters);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a promotional code' })
  @ApiResponse({ status: 201, type: PromotionCodeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() body: PromotionCodeCreateDto) {
    return this.promotionCodeService.create(body);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update or deactivate a promotional code' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PromotionCodeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(
    @Param('id') id: string,
    @Body() body: PromotionCodeUpdateDto,
  ) {
    return this.promotionCodeService.update(+id, body);
  }
}
