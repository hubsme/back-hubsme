import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { User } from '@db/tables/user.table';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { MercadoPagoAuthUrlDto, MercadoPagoAuthUrlResponseDto, MercadoPagoCallbackDto } from './dto/mercado-pago-auth.dto';
import {
  MercadoPagoCheckoutDto,
  MercadoPagoCreateCheckoutDto,
  MercadoPagoPaymentWebhookQueryDto,
} from './dto/mercado-pago-checkout.dto';
import { MercadoPagoStatusDto } from './dto/mercado-pago-status.dto';
import { MercadoPagoService } from './mercado-pago.service';

type AuthenticatedRequest = { user: User };

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
  authUrl(@Query() query: MercadoPagoAuthUrlDto) {
    return this.mercadoPagoService.getAuthUrl(query);
  }

  @Get('callback')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Mercado Pago OAuth callback for consultant connection' })
  @ApiResponse({ status: 200, description: 'HTML response that posts the connection result to the opener window' })
  callback(@Query() query: MercadoPagoCallbackDto) {
    return this.mercadoPagoService.handleCallback(query);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get consultant Mercado Pago connection status' })
  @ApiResponse({ status: 200, type: MercadoPagoStatusDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  status(@Query() query: MercadoPagoAuthUrlDto) {
    return this.mercadoPagoService.getStatus(query.consultantId);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect consultant Mercado Pago account' })
  @ApiResponse({ status: 200, type: MercadoPagoStatusDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  disconnect(@Query() query: MercadoPagoAuthUrlDto) {
    return this.mercadoPagoService.disconnect(query.consultantId);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Mercado Pago checkout for a pending meeting' })
  @ApiResponse({ status: 200, type: MercadoPagoCheckoutDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  createCheckout(@Request() req: AuthenticatedRequest, @Body() body: MercadoPagoCreateCheckoutDto) {
    return this.mercadoPagoService.createCheckout(req.user.id, body);
  }

  @Get('checkout/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a Mercado Pago checkout by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MercadoPagoCheckoutDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findCheckout(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.mercadoPagoService.findCheckout(req.user.id, +id);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mercado Pago payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  webhook(@Query() query: MercadoPagoPaymentWebhookQueryDto) {
    return this.mercadoPagoService.handleWebhook(query);
  }
}
