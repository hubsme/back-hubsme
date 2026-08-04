import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CONSULTANT_DIAGNOSTIC_AREAS, ConsultantDiagnosticArea } from '@core/consultant-diagnostic-area';

export class ServiceConsultantMatchDto {
  @ApiProperty()
  @IsInt()
  consultantId: number;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ nullable: true })
  headline: string | null;

  @ApiProperty({ nullable: true })
  photoUrl: string | null;

  @ApiProperty({ enum: CONSULTANT_DIAGNOSTIC_AREAS, isArray: true })
  diagnosticAreas: ConsultantDiagnosticArea[];

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiProperty({ type: [String] })
  services: string[];

  @ApiProperty()
  yearsExperience: number;

  @ApiProperty()
  rating: string;

  @ApiProperty({ maxLength: 400 })
  @IsString()
  @MaxLength(400)
  reason: string;
}

export class ServiceConsultantMatchesResultDto {
  @ApiProperty({ type: [ServiceConsultantMatchDto], minItems: 3, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ServiceConsultantMatchDto)
  matches: ServiceConsultantMatchDto[];
}
