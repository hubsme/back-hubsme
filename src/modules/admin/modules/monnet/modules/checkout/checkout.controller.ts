import { TraceNode } from '@erixcel/traceflow';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { CheckoutService } from './checkout.service';
import { MonnetCreateCheckoutDto, MonnetCheckoutResultDto } from './dto/create-checkout.dto';
import { MonnetFindCheckoutResultDto } from './dto/find-checkout.dto';
import {
  MonnetPrepareCheckoutPaymentDto,
  MonnetPrepareCheckoutPaymentResultDto,
} from './dto/prepare-checkout-payment.dto';
import { MonnetSyncCheckoutPaymentResultDto } from './dto/sync-checkout-payment.dto';

@ApiTags('monnetCheckout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/monnet/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Crear checkout de reunión con Monnet QR' })
  @ApiResponse({ status: 200, type: MonnetCheckoutResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'createCheckout', type: 'controller' })
  createCheckout(@Request() req: AuthenticatedRequest, @Body() body: MonnetCreateCheckoutDto) {
    return this.checkoutService.createCheckout(req.user, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar checkout y QR de la reunión' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: MonnetFindCheckoutResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findCheckout', type: 'controller' })
  findCheckout(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.checkoutService.findCheckout(req.user, id);
  }

  @Post(':id/payment')
  @HttpCode(200)
  @ApiOperation({ summary: 'Generar QR de pago con el importe calculado por Hubsme' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: MonnetPrepareCheckoutPaymentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'prepareCheckoutPayment', type: 'controller' })
  prepareCheckoutPayment(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MonnetPrepareCheckoutPaymentDto,
  ) {
    return this.checkoutService.prepareCheckoutPayment(req.user, id, body);
  }

  @Post(':id/payment/sync')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verificar en Monnet y confirmar el pago de la reunión' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: MonnetSyncCheckoutPaymentResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'syncCheckoutPayment', type: 'controller' })
  syncCheckoutPayment(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.checkoutService.syncCheckoutPayment(req.user, id);
  }
}
