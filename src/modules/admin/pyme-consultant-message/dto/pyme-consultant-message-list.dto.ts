import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PymeConsultantMessageResultDto } from './pyme-consultant-message-result.dto';

export class PymeConsultantMessageListFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  matchId: number;
}

export class PymeConsultantMessageListDto {
  @ApiProperty({ type: [PymeConsultantMessageResultDto] })
  data: PymeConsultantMessageResultDto[];
}
