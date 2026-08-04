import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class PromotionCodeCreateDto {
  @ApiPropertyOptional({ example: 'GRATIS-JULIO', description: 'If omitted, the backend generates a code' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  code?: string;

  @ApiPropertyOptional({ example: 'Campaña para primeras consultorias' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxRedemptions: number;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startsAt?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({
    type: [Number],
    nullable: true,
    description: 'IDs de PYMEs autorizadas. Null permite cualquier PYME.',
  })
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  allowedPymeIds?: number[] | null;

  @ApiPropertyOptional({
    type: [Number],
    nullable: true,
    description: 'IDs de consultores autorizados. Null permite cualquier consultor.',
  })
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  allowedConsultantIds?: number[] | null;
}

export class PromotionCodeUpdateDto extends PartialType(PromotionCodeCreateDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class PromotionCodeListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

export class PromotionCodeResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  maxRedemptions: number;

  @ApiProperty()
  redemptionCount: number;

  @ApiPropertyOptional({ nullable: true })
  startsAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  expiresAt: Date | null;

  @ApiPropertyOptional({ type: [Number], nullable: true })
  allowedPymeIds: number[] | null;

  @ApiPropertyOptional({ type: [Number], nullable: true })
  allowedConsultantIds: number[] | null;

  @ApiProperty()
  isActive: boolean;
}

export class PromotionCodeListDto {
  @ApiProperty({ type: [PromotionCodeResultDto] })
  data: PromotionCodeResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PromotionCodeRedemptionDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  checkoutId: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true })
  meetingId: number | null;

  @ApiProperty()
  redeemedAt: Date;
}

export class PromotionCodeDetailDto extends PromotionCodeResultDto {
  @ApiProperty({ type: [PromotionCodeRedemptionDetailDto] })
  redemptions: PromotionCodeRedemptionDetailDto[];
}

export class PromotionCodeRedeemDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  checkoutId: number;

  @ApiProperty({ example: 'GRATIS-JULIO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code: string;
}

export class PromotionCodeRedeemResultDto {
  @ApiProperty()
  meetingId: number;

  @ApiProperty()
  checkoutId: number;

  @ApiProperty()
  code: string;

  @ApiProperty({ example: 'Consultoria gratuita confirmada' })
  message: string;
}
