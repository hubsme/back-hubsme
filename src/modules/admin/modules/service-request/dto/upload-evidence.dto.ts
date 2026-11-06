import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

@Trace({ type: 'validation' })
export class ServiceRequestEvidenceMultipartDto {
  @ApiPropertyOptional({ example: 'Constancia SUNAT correspondiente al primer entregable.' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 49 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(49)
  @IsOptional()
  milestoneIndex?: number;
}
