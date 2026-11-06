import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ConsultantGoogleCalendarBusyItemDto } from '@modules/admin/modules/consultant-google-calendar/dto/auth-url.dto';

@Trace({ type: 'validation' })
export class ConsultantGoogleCalendarBusyMonthDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  year: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

@Trace({ type: 'validation' })
export class ConsultantGoogleCalendarBusyMonthResponseDto {
  @ApiProperty({ type: () => [ConsultantGoogleCalendarBusyItemDto] })
  data: ConsultantGoogleCalendarBusyItemDto[];
}
