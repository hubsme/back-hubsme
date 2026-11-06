import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { promotionCodeTypeEnum } from '@db/tables/promotion-code.table';

@Trace({ type: 'validation' })
export class PromotionCodeCreateDto {
  @ApiPropertyOptional({ example: 'GRATIS-JULIO', description: 'If omitted, the backend generates a code' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  code?: string;

  @ApiPropertyOptional({
    enum: promotionCodeTypeEnum.enumValues,
    default: 'consultation',
    description: 'Contexto en el que puede canjearse el cupón',
  })
  @IsEnum(promotionCodeTypeEnum.enumValues)
  @IsOptional()
  type?: (typeof promotionCodeTypeEnum.enumValues)[number] = 'consultation';

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

@Trace({ type: 'validation' })
export class PromotionCodeResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: promotionCodeTypeEnum.enumValues })
  type: (typeof promotionCodeTypeEnum.enumValues)[number];

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
