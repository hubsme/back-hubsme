import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

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

export class PymeConsultantMessageCreateDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  matchId: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  senderId: number;

  @ApiProperty({ example: 'Hola, revisemos una primera sesion esta semana.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
