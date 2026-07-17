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
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { WhatsappSendResultDto } from './dto/whatsapp-send-result.dto';
import { WhatsappNotificacionPymeDto } from './dto/whatsapp-notificacion-pyme.dto';
import { WhatsappNotificacionConsultorDto } from './dto/whatsapp-notificacion-consultor.dto';
import { WhatsappAlertaReunionConsultorDto } from './dto/whatsapp-alerta-reunion-consultor.dto';
import { WhatsappAlertaReunionDto } from './dto/whatsapp-alerta-reunion.dto';
import { WhatsappConsultorConfirmarReunionDto } from './dto/whatsapp-consultor-confirmar-reunion.dto';
import { WhatsappWebhookAcceptedDto, WhatsappWebhookPayloadDto } from './dto/whatsapp-webhook.dto';
import { WhatsappService } from './whatsapp.service';
import type { WhatsappWebhookRequest } from './types/whatsapp-webhook.types';

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
  async sendNotificacionConsultor(@Body() dto: WhatsappNotificacionConsultorDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendNotificacionConsultor(dto.to, dto);
  }

  @Post('alerta-reunion-consultor')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar plantilla alerta_reunion_consultor' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
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
  async sendConsultorConfirmarReunion(
    @Body() dto: WhatsappConsultorConfirmarReunionDto,
  ): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendConsultorConfirmarReunion(dto.to, dto);
  }

  @Get('webhook')
  @ApiOperation({ summary: 'Verificar el webhook de WhatsApp con Meta' })
  @ApiProduces('text/plain')
  @ApiQuery({ name: 'hub.mode', example: 'subscribe' })
  @ApiQuery({ name: 'hub.verify_token', example: 'token-configurado-en-el-backend' })
  @ApiQuery({ name: 'hub.challenge', example: '123456' })
  @ApiResponse({ status: 200, description: 'Devuelve el valor recibido en hub.challenge', type: String })
  @ApiResponse({ status: 403, description: 'El token de verificación no coincide' })
  verifyWebhook(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') token?: string,
    @Query('hub.challenge') challenge?: string,
  ) {
    return this.whatsappService.verifySubscription(mode, token, challenge);
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
  receiveWebhook(
    @Body() payload: WhatsappWebhookPayloadDto,
    @Req() request: WhatsappWebhookRequest,
    @Headers('x-hub-signature-256') signature?: string,
  ) {
    return this.whatsappService.acceptWebhook(payload, request.rawBody, signature);
  }
}
