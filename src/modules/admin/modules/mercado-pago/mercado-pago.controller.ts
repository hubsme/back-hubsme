import { MonnetCheckoutResultDto } from '@modules/admin/modules/monnet/modules/checkout/dto/create-checkout.dto';
import { MonnetPrepareCheckoutPaymentDto } from '@modules/admin/modules/monnet/modules/checkout/dto/prepare-checkout-payment.dto';
import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { MercadoPagoSyncServicePaymentResultDto } from './dto/sync-service-payment.dto';
import { MercadoPagoPrepareCheckoutPaymentResultDto } from './dto/prepare-checkout-payment.dto';
import { MercadoPagoFindCheckoutResultDto } from './dto/find-checkout.dto';
import { MercadoPagoDisconnectResultDto } from './dto/disconnect.dto';
import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { MercadoPagoAuthUrlDto, MercadoPagoAuthUrlResponseDto } from '@modules/admin/modules/mercado-pago/dto/auth-url.dto';
import { MercadoPagoCallbackDto } from '@modules/admin/modules/mercado-pago/dto/callback.dto';
import { MercadoPagoCheckoutDto, MercadoPagoCreateCheckoutDto } from '@modules/admin/modules/mercado-pago/dto/create-checkout.dto';
import { MercadoPagoPaymentWebhookQueryDto } from '@modules/admin/modules/mercado-pago/dto/webhook.dto';
import { MercadoPagoServicePaymentDto } from '@modules/admin/modules/mercado-pago/dto/prepare-service-payment.dto';
import { MercadoPagoPaymentHistoryFiltersDto, MercadoPagoPaymentHistoryResponseDto } from '@modules/admin/modules/mercado-pago/dto/find-payments.dto';
import { MercadoPagoPaymentHistoryItemDto } from '@modules/admin/modules/mercado-pago/dto/find-payment.dto';
import { MercadoPagoStatusDto } from '@modules/admin/modules/mercado-pago/dto/status.dto';
import { MercadoPagoService } from '@modules/admin/modules/mercado-pago/mercado-pago.service';

@ApiTags('mercadoPago')
@Controller('admin/mercado-pago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Mercado Pago OAuth URL for a consultant' })
  @ApiResponse({ status: 200, type: MercadoPagoAuthUrlResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'authUrl', type: 'controller' })
  authUrl(@Query() query: MercadoPagoAuthUrlDto) {
    return this.mercadoPagoService.getAuthUrl(query);
  }

  @Get('callback')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Mercado Pago OAuth callback for consultant connection' })
  @ApiResponse({ status: 200, description: 'HTML response that posts the connection result to the opener window' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'callback', type: 'controller' })
  callback(@Query() query: MercadoPagoCallbackDto) {
    return this.mercadoPagoService.handleCallback(query);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consultant Mercado Pago connection status' })
  @ApiResponse({ status: 200, type: MercadoPagoStatusDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'status', type: 'controller' })
  status(@Query() query: MercadoPagoAuthUrlDto) {
    return this.mercadoPagoService.getStatus(query.consultantId);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect consultant Mercado Pago account' })
  @ApiResponse({ status: 200, type: MercadoPagoDisconnectResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'disconnect', type: 'controller' })
  disconnect(@Query() query: MercadoPagoAuthUrlDto) {
    return this.mercadoPagoService.disconnect(query.consultantId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear checkout Monnet (ruta anterior)', deprecated: true })
  @ApiResponse({ status: 200, type: MonnetCheckoutResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'createCheckout', type: 'controller' })
  createCheckout(@Request() req: AuthenticatedRequest, @Body() body: MercadoPagoCreateCheckoutDto) {
    return this.mercadoPagoService.createCheckout(req.user, body);
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Mercado Pago payments for the authenticated user' })
  @ApiResponse({ status: 200, type: MercadoPagoPaymentHistoryResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findPayments', type: 'controller' })
  findPayments(@Request() req: AuthenticatedRequest, @Query() filters: MercadoPagoPaymentHistoryFiltersDto) {
    return this.mercadoPagoService.findPayments(req.user, filters);
  }

  @Get('payments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Mercado Pago payment detail for the authenticated user' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MercadoPagoPaymentHistoryItemDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findPayment', type: 'controller' })
  findPayment(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.mercadoPagoService.findPayment(req.user, id);
  }

  @Get('checkout/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar checkout Monnet (ruta anterior)', deprecated: true })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MercadoPagoFindCheckoutResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findCheckout', type: 'controller' })
  findCheckout(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.mercadoPagoService.findCheckout(req.user, id);
  }

  @Post('checkout/:id/payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar QR Monnet (ruta anterior)', deprecated: true })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MercadoPagoPrepareCheckoutPaymentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'prepareCheckoutPayment', type: 'controller' })
  prepareCheckoutPayment(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number, @Body() body: MonnetPrepareCheckoutPaymentDto) {
    return this.mercadoPagoService.prepareCheckoutPayment(req.user, id, body);
  }

  @Post('service/:id/payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create the Mercado Pago preference for a service installment' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MercadoPagoCheckoutDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'prepareServicePayment', type: 'controller' })
  prepareServicePayment(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number, @Body() body?: MercadoPagoServicePaymentDto) {
    return this.mercadoPagoService.prepareServicePayment(req.user, id, body?.installmentIndex);
  }

  @Post('service/:id/payment/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronize a service installment payment with Mercado Pago' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MercadoPagoSyncServicePaymentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'syncServicePayment', type: 'controller' })
  syncServicePayment(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number, @Body() body?: MercadoPagoServicePaymentDto) {
    return this.mercadoPagoService.syncServicePayment(req.user, id, body?.installmentIndex);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mercado Pago payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'webhook', type: 'controller' })
  webhook(@Query() query: MercadoPagoPaymentWebhookQueryDto) {
    return this.mercadoPagoService.handleWebhook(query);
  }
}
