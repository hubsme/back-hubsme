import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { PromotionCodeCreateDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/create.dto';

@Trace({ type: 'validation' })
export class PromotionCodeUpdateDto extends PartialType(PromotionCodeCreateDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
