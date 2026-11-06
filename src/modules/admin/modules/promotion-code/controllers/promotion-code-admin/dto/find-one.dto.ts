import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { PromotionCodeResultDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/create.dto';
import { PromotionCodeRedemptionDetailDto } from '@modules/admin/modules/promotion-code/dto/redeem.dto';

@Trace({ type: 'validation' })
export class PromotionCodeDetailDto extends PromotionCodeResultDto {
  @ApiProperty({ type: () => [PromotionCodeRedemptionDetailDto] })
  redemptions: PromotionCodeRedemptionDetailDto[];
}
