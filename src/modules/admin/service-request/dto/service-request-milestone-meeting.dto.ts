import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, Max, Min } from 'class-validator';

export class ServiceRequestMilestoneMeetingDto {
  @ApiProperty({ example: 0, minimum: 0, maximum: 19 })
  @IsInt()
  @Min(0)
  @Max(19)
  milestoneIndex: number;

  @ApiProperty({
    type: [String],
    example: ['2026-08-19T15:00:00.000Z', '2026-08-20T15:00:00.000Z', '2026-08-21T15:00:00.000Z'],
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  proposedStartTimes: string[];
}
