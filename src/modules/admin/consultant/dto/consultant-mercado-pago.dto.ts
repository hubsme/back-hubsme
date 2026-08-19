import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class MercadoPagoAccountProfileDto {
  @ApiProperty({ example: '123456789', nullable: true })
  id: string | null;

  @ApiProperty({ example: 'consultor_mp', nullable: true })
  nickname: string | null;

  @ApiProperty({ example: 'consultor@mail.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: 'Miguel', nullable: true })
  firstName: string | null;

  @ApiProperty({ example: 'Salinas', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'MPE', nullable: true })
  siteId: string | null;

  @ApiProperty({ example: 'PE', nullable: true })
  countryId: string | null;

  @ApiProperty({ example: 'normal', nullable: true })
  userType: string | null;

  @ApiProperty({ example: 'https://www.mercadolibre.com.pe/perfil/consultor_mp', nullable: true })
  permalink: string | null;

  @ApiProperty({ example: '2026-06-17T15:00:00.000Z', nullable: true })
  registrationDate: Date | null;

  @ApiProperty({ example: '2026-06-17T15:00:00.000Z', nullable: true })
  dateCreated: Date | null;
}

export class ConsultantMercadoPagoAdminDto {
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

  @ApiProperty({ example: '2026-06-17T15:00:00.000Z', nullable: true })
  lastUpdatedAt: Date | null;

  @ApiProperty({ type: () => MercadoPagoAccountProfileDto, nullable: true })
  accountProfile: MercadoPagoAccountProfileDto | null;

  @ApiProperty({ example: '2026-06-17T15:00:00.000Z', nullable: true })
  tokenExpiresAt: Date | null;

  @ApiProperty({ example: '2026-08-19T15:30:00.000Z', nullable: true })
  profileLastCheckedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  profileError: string | null;
}

export class MercadoPagoFinancialReportDto {
  @ApiProperty({ example: '123456789', nullable: true })
  id: string | null;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z', nullable: true })
  beginDate: Date | null;

  @ApiProperty({ example: '2026-08-19T23:59:59.000Z', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: 'settlement_report_20260819.csv', nullable: true })
  fileName: string | null;

  @ApiProperty({ example: '2026-08-19T15:30:00.000Z', nullable: true })
  createdAt: Date | null;
}

export class ConsultantMercadoPagoFinancialAdminDto {
  @ApiProperty({ example: true })
  connected: boolean;

  @ApiProperty({ enum: ['available', 'not_available', 'error'], example: 'available' })
  status: 'available' | 'not_available' | 'error';

  @ApiProperty({ example: 'PEN', nullable: true })
  currency: string | null;

  @ApiProperty({ example: false })
  balanceAvailable: boolean;

  @ApiProperty({ example: 4 })
  reportCount: number;

  @ApiProperty({ type: () => MercadoPagoFinancialReportDto, nullable: true })
  latestReport: MercadoPagoFinancialReportDto | null;

  @ApiProperty({ example: '2026-08-19T15:30:00.000Z', nullable: true })
  lastUpdatedAt: Date | null;

  @ApiProperty({ example: 'Se encontró el último reporte financiero disponible.' })
  message: string;
}

export class ConsultantMercadoPagoFinancialDownloadPendingDto {
  @ApiProperty({ example: 'processing' })
  status: 'processing';

  @ApiProperty({ example: 99336983670, nullable: true })
  taskId: string | null;

  @ApiProperty({ example: 'Mercado Pago está generando el reporte. Intenta descargarlo nuevamente en unos minutos.' })
  message: string;
}

export class ConsultantMercadoPagoFinancialDownloadQueryDto {
  @ApiPropertyOptional({
    example: '99336983670',
    description: 'Mercado Pago report generation task to continue tracking instead of creating a new report.',
  })
  @IsString()
  @Matches(/^\d+$/)
  @IsOptional()
  taskId?: string;
}
