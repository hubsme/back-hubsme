import type { pymeMember } from '@db/tables/pyme-member.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class PymeConsultantMessageResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  matchId: number;

  @ApiProperty()
  senderId: number;

  @ApiProperty({ nullable: true })
  senderName: string | null;

  @ApiProperty({ enum: ['admin', 'pyme', 'consultor'], nullable: true })
  senderRole: 'admin' | 'pyme' | 'consultor' | null;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  readAt: Date | null;
}

@Trace({ type: 'validation' })
export class PymeMemberResultDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ['owner', 'member'] })
  role: (typeof pymeMember.$inferSelect)['role'];

  @ApiProperty({ enum: ['active', 'suspended'] })
  status: 'active' | 'suspended';

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  isCurrentUser: boolean;
}

@Trace({ type: 'validation' })
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
  userEmail: string;

  @ApiProperty({ enum: ['local', 'google'] })
  authProvider: 'local' | 'google';

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  ruc: string | null;

  @ApiProperty({ nullable: true })
  ownerFirstName: string | null;

  @ApiProperty({ nullable: true })
  ownerLastName: string | null;

  @ApiProperty({ nullable: true })
  ownerEmail: string | null;

  @ApiProperty({ nullable: true })
  ownerPhone: string | null;

  @ApiProperty({ nullable: true })
  ownerPosition: string | null;

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
