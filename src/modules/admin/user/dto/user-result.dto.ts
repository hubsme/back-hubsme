import { ApiProperty } from '@nestjs/swagger';

export class UserResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: 'consultor@hubsme.com' })
  email: string;

  @ApiProperty({ example: 'Carlos Mendoza' })
  name: string;

  @ApiProperty({ enum: ['admin', 'pyme', 'consultor'] })
  role: 'admin' | 'pyme' | 'consultor';

  @ApiProperty({ enum: ['true', 'false'] })
  isActive: string;
}
