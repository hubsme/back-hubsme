import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@Trace({ type: 'validation' })
export class ServiceRequestDeclineDto {
  @ApiPropertyOptional({ example: 'No podremos continuar con esta solicitud.', maxLength: 3000 })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  message?: string;
}
