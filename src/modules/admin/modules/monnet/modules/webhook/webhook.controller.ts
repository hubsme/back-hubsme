import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { WebhookService } from './webhook.service';
import { MonnetPayinWebhookDto, MonnetPayinWebhookResultDto } from './dto/payin.dto';

@ApiTags('monnetWebhook')
@Controller('admin/monnet/webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('payin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recibir y verificar notificación Payin de Monnet' })
  @ApiResponse({ status: 200, type: MonnetPayinWebhookResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'payin', type: 'controller' })
  payin(@Body() body: MonnetPayinWebhookDto) {
    return this.webhookService.payin(body);
  }
}
