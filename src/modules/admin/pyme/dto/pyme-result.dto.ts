import { ApiProperty } from '@nestjs/swagger';

export class PymeResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  ruc: string | null;

  @ApiProperty({ nullable: true })
  sector: string | null;

  @ApiProperty({ nullable: true })
  numEmployees: number | null;

  @ApiProperty({ nullable: true })
  yearsInOperation: number | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  logoUrl: string | null;
}
