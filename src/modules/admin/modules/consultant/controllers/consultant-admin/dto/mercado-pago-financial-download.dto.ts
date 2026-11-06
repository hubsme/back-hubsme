import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

@Trace({ type: 'validation' })
export class ConsultantMercadoPagoFinancialDownloadPendingDto {
  @ApiProperty({ example: 'processing' })
  status: 'processing';

  @ApiProperty({ example: 99336983670, nullable: true })
  taskId: string | null;

  @ApiProperty({ example: 'Mercado Pago está generando el reporte. Intenta descargarlo nuevamente en unos minutos.' })
  message: string;
}

@Trace({ type: 'validation' })
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
