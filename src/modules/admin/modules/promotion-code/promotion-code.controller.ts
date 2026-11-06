import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import {
  PromotionCodeRedeemDto,
  PromotionCodeRedeemResultDto,
} from '@modules/admin/modules/promotion-code/dto/redeem.dto';
import {
  PromotionCodeRedeemServiceDto,
  PromotionCodeRedeemServiceResultDto,
} from '@modules/admin/modules/promotion-code/dto/redeem-service.dto';
import { PromotionCodeService } from '@modules/admin/modules/promotion-code/promotion-code.service';

@ApiTags('promotionCode')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/promotion-code')
export class PromotionCodeController {
  constructor(private readonly promotionCodeService: PromotionCodeService) {}

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a code for a free consulting session' })
  @ApiResponse({ status: 201, type: PromotionCodeRedeemResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'redeem', type: 'controller' })
  redeem(@Request() req: AuthenticatedRequest, @Body() body: PromotionCodeRedeemDto) {
    return this.promotionCodeService.redeemForUser(req.user, body);
  }

  @Post('redeem-service')
  @ApiOperation({ summary: 'Redeem a service code for the next available installment' })
  @ApiResponse({ status: 201, type: PromotionCodeRedeemServiceResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'redeemService', type: 'controller' })
  redeemService(@Request() req: AuthenticatedRequest, @Body() body: PromotionCodeRedeemServiceDto) {
    return this.promotionCodeService.redeemServiceForUser(req.user, body);
  }
}
