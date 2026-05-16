import { ApiProperty } from '@nestjs/swagger';

export class PymeConsultantMatchResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty({ nullable: true })
  pymeName: string | null;

  @ApiProperty({ nullable: true })
  pymeSector: string | null;

  @ApiProperty({ nullable: true })
  pymeNumEmployees: number | null;

  @ApiProperty({ nullable: true })
  pymeYearsInOperation: number | null;

  @ApiProperty({ nullable: true })
  pymeDescription: string | null;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ nullable: true })
  consultantName: string | null;

  @ApiProperty({ nullable: true })
  consultantBio: string | null;

  @ApiProperty({ type: [String] })
  consultantSpecialties: string[];

  @ApiProperty({ nullable: true })
  consultantPhotoUrl: string | null;

  @ApiProperty()
  consultantPricePerHour: string;

  @ApiProperty()
  consultantRating: string;

  @ApiProperty({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  status: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiProperty()
  source: string;

  @ApiProperty({ nullable: true })
  notes: string | null;
}
