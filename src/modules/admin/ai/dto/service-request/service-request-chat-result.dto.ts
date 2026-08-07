import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ServiceRequestDraftDto } from './service-request-draft.dto';

export class ServiceRequestChatResultDto {
  @ApiProperty({ maxLength: 1500 })
  @IsString()
  @MinLength(2)
  @MaxLength(1500)
  message: string;

  @ApiProperty({ enum: ['gathering', 'confirming', 'complete'] })
  @IsIn(['gathering', 'confirming', 'complete'])
  phase: 'gathering' | 'confirming' | 'complete';

  @ApiProperty({ description: 'Indica si la PYME ya puede continuar a la revisión de la solicitud' })
  @IsBoolean()
  isComplete: boolean;

  @ApiProperty({ type: ServiceRequestDraftDto })
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft: ServiceRequestDraftDto;

  @ApiProperty({ type: [String], maxItems: 12 })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  missingInformation: string[];
}
