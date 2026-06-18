import { ApiProperty } from '@nestjs/swagger';

export class MercadoPagoStatusDto {
  @ApiProperty({ example: true })
  connected: boolean;

  @ApiProperty({ example: '123456789', nullable: true })
  mercadoPagoUserId: string | null;

  @ApiProperty({ example: 'consultor_mp', nullable: true })
  nickname: string | null;

  @ApiProperty({ example: 'consultor@mail.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '2026-06-17T15:00:00.000Z', nullable: true })
  connectedAt: Date | null;
}
