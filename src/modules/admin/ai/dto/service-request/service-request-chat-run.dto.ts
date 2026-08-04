import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ServiceRequestDraftDto } from './service-request-draft.dto';

export class ServiceRequestChatMessageDto {
  @ApiProperty({ enum: ['assistant', 'user'] })
  @IsIn(['assistant', 'user'])
  role: 'assistant' | 'user';

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class ServiceRequestChatRunDto {
  @ApiProperty({ type: [ServiceRequestChatMessageDto], minItems: 2, maxItems: 40 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestChatMessageDto)
  messages: ServiceRequestChatMessageDto[];

  @ApiPropertyOptional({ type: ServiceRequestDraftDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceRequestDraftDto)
  draft?: ServiceRequestDraftDto;
}
