import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { MercadoPagoFinancialReportDto } from '@modules/admin/modules/consultant/controllers/consultant-admin/dto/mercado-pago.dto';

@Trace({ type: 'validation' })
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
