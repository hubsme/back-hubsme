import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { User } from '@db/tables/user.table';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import {
  PromotionCodeRedeemDto,
  PromotionCodeRedeemResultDto,
} from './dto/promotion-code.dto';
import { PromotionCodeService } from './promotion-code.service';

type AuthenticatedRequest = { user: User };

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
  redeem(
    @Request() req: AuthenticatedRequest,
    @Body() body: PromotionCodeRedeemDto,
  ) {
    return this.promotionCodeService.redeem(req.user.id, body);
  }
}
