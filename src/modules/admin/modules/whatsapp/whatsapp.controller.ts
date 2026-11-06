import { TraceNode } from '@erixcel/traceflow';
import { WhatsappVerifyWebhookQueryDto } from './dto/verify-webhook.dto';
import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { WhatsappSendDto } from '@modules/admin/modules/whatsapp/dto/send-message.dto';
import { WhatsappSendResultDto } from '@modules/admin/modules/whatsapp/dto/send-message.dto';
import { WhatsappNotificacionPymeDto } from '@modules/admin/modules/whatsapp/dto/send-notificacion-pyme.dto';
import { WhatsappNotificacionConsultorDto } from '@modules/admin/modules/whatsapp/dto/send-notificacion-consultor.dto';
import { WhatsappAlertaReunionConsultorDto } from '@modules/admin/modules/whatsapp/dto/send-alerta-reunion-consultor.dto';
import { WhatsappAlertaReunionDto } from '@modules/admin/modules/whatsapp/dto/send-alerta-reunion-pyme.dto';
import { WhatsappConsultorConfirmarReunionDto } from '@modules/admin/modules/whatsapp/dto/send-consultor-confirmar-reunion.dto';
import {
  WhatsappWebhookAcceptedDto,
  WhatsappWebhookPayloadDto,
} from '@modules/admin/modules/whatsapp/dto/receive-webhook.dto';
import { WhatsappNotificacionCancelacionPymeDto } from '@modules/admin/modules/whatsapp/dto/send-notificacion-cancelacion-pyme.dto';
import { WhatsappService } from '@modules/admin/modules/whatsapp/whatsapp.service';
import type { WhatsappWebhookRequest } from '@modules/admin/modules/whatsapp/types/whatsapp-webhook.types';

@ApiTags('whatsapp')
@Controller('admin/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar un mensaje por WhatsApp' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendMessage', type: 'controller' })
  async sendMessage(@Body() sendMessageDto: WhatsappSendDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendMessage(sendMessageDto);
  }

  @Post('notificacion-pyme')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla notificacion_pyme' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendNotificacionPyme', type: 'controller' })
  async sendNotificacionPyme(@Body() dto: WhatsappNotificacionPymeDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendNotificacionPyme(dto.to, dto);
  }

  @Post('notificacion-consultor')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla notificacion_consultor' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendNotificacionConsultor', type: 'controller' })
  async sendNotificacionConsultor(@Body() dto: WhatsappNotificacionConsultorDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendNotificacionConsultor(dto.to, dto);
  }

  @Post('notificacion-cancelacion-pyme')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla notificacion_cancelacion_pyme' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendNotificacionCancelacionPyme', type: 'controller' })
  async sendNotificacionCancelacionPyme(
    @Body() dto: WhatsappNotificacionCancelacionPymeDto,
  ): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendNotificacionCancelacionPyme(dto.to, dto);
  }

  @Post('alerta-reunion-consultor')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla alerta_reunion_consultor' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendAlertaReunionConsultor', type: 'controller' })
  async sendAlertaReunionConsultor(@Body() dto: WhatsappAlertaReunionConsultorDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendAlertaReunionConsultor(dto.to, dto);
  }

  @Post('alerta-reunion-pyme')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla alerta_reunion_pyme' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendAlertaReunionPyme', type: 'controller' })
  async sendAlertaReunionPyme(@Body() dto: WhatsappAlertaReunionDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendAlertaReunionPyme(dto.to, dto);
  }

  @Post('consultor-confirmar-reunion')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla consultor_confirmar_reunion' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'sendConsultorConfirmarReunion', type: 'controller' })
  async sendConsultorConfirmarReunion(
    @Body() dto: WhatsappConsultorConfirmarReunionDto,
  ): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendConsultorConfirmarReunion(dto.to, dto);
  }

  @Get('webhook')
  @ApiOperation({ summary: 'Verificar el webhook de WhatsApp con Meta' })
  @ApiProduces('text/plain')
  @ApiResponse({ status: 200, description: 'Devuelve el valor recibido en hub.challenge', type: String })
  @ApiResponse({ status: 403, description: 'El token de verificación no coincide' })
  @TraceNode({ name: 'verifyWebhook', type: 'controller' })
  verifyWebhook(@Query() query: WhatsappVerifyWebhookQueryDto) {
    return this.whatsappService.verifySubscription(
      query['hub.mode'],
      query['hub.verify_token'],
      query['hub.challenge'],
    );
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Recibir mensajes y eventos entrantes de WhatsApp' })
  @ApiHeader({
    name: 'x-hub-signature-256',
    description: 'Firma HMAC SHA-256 enviada por Meta',
    required: true,
  })
  @ApiBody({ type: WhatsappWebhookPayloadDto })
  @ApiResponse({ status: 200, type: WhatsappWebhookAcceptedDto })
  @ApiResponse({ status: 401, description: 'La firma enviada por Meta es inválida' })
  @TraceNode({ name: 'receiveWebhook', type: 'controller' })
  receiveWebhook(
    @Body() payload: WhatsappWebhookPayloadDto,
    @Req() request: WhatsappWebhookRequest,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    return this.whatsappService.acceptWebhook(payload, request.rawBody, signature);
  }
}
