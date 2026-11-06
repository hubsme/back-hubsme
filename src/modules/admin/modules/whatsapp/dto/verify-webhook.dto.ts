import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class WhatsappVerifyWebhookQueryDto {
  @ApiProperty({ example: 'subscribe' })
  @IsOptional()
  @IsString()
  'hub.mode'?: string;

  @ApiProperty({ example: 'token-configurado-en-el-backend' })
  @IsOptional()
  @IsString()
  'hub.verify_token'?: string;

  @ApiProperty({ example: '123456' })
  @IsOptional()
  @IsString()
  'hub.challenge'?: string;
}
