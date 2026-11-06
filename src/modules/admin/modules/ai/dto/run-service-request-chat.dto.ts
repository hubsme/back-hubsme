import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { ServiceRequestDraftDto, ServiceRequestChatMessageDto } from '@modules/admin/modules/ai/dto/run-hubsme-ai.dto';

@Trace({ type: 'validation' })
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

  @ApiProperty({ type: () => ServiceRequestDraftDto })
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft: ServiceRequestDraftDto;

  @ApiProperty({ type: [String], maxItems: 12 })
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  missingInformation: string[];
}

@Trace({ type: 'validation' })
export class ServiceRequestChatRunDto {
  @ApiProperty({ type: () => [ServiceRequestChatMessageDto], minItems: 2, maxItems: 40 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestChatMessageDto)
  messages: ServiceRequestChatMessageDto[];

  @ApiPropertyOptional({ type: () => ServiceRequestDraftDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft?: ServiceRequestDraftDto;

  @ApiPropertyOptional({
    description: 'Acta finalizada de consultoría que se usará como contexto inicial de la solicitud',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sourceMeetingId?: number;

  @ApiPropertyOptional({
    description: 'Tarea concreta del acta que se usará como alcance inicial de la solicitud',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  sourceTaskId?: number;
}
