import { HttpErrorDto } from '@dto/http-error.dto';
import { TraceNode } from '@erixcel/traceflow';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PayinCreateBankTransferDto,
  PayinTransactionResultDto,
} from './dto/create-bank-transfer.dto';
import { PayinCreateQrDto } from './dto/create-qr.dto';
import { PayinCreateYapeMobileDto } from './dto/create-yape-mobile.dto';
import { PayinCreateYapeWebDto } from './dto/create-yape-web.dto';
import { PayinService } from './payin.service';

@ApiTags('monnetPayin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/monnet/payin/create-transaction')
export class PayinController {
  constructor(private readonly payinService: PayinService) {}

  @Post('standard/bank-transfer')
  @ApiOperation({ summary: 'PER · Válida · Monnet · Bank Transfer' })
  @ApiResponse({ status: 200, type: PayinTransactionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @HttpCode(200)
  @TraceNode({ name: 'monnet.payin.createBankTransfer', type: 'controller' })
  createBankTransfer(@Body() body: PayinCreateBankTransferDto) {
    return this.payinService.createTransaction(body, 'bank-transfer');
  }

  @Post('standard/qr')
  @ApiOperation({ summary: 'PER · Válida · QR (Ligo en la colección)' })
  @ApiResponse({ status: 200, type: PayinTransactionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @HttpCode(200)
  @TraceNode({ name: 'monnet.payin.createQr', type: 'controller' })
  createQr(@Body() body: PayinCreateQrDto) {
    return this.payinService.createTransaction(body, 'qr');
  }

  @Post('white-label/yape/mobile')
  @ApiOperation({ summary: 'White Label · Válida · Yape One Shot Mobile' })
  @ApiResponse({ status: 200, type: PayinTransactionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @HttpCode(200)
  @TraceNode({ name: 'monnet.payin.createYapeMobile', type: 'controller' })
  createYapeMobile(@Body() body: PayinCreateYapeMobileDto) {
    return this.payinService.createTransaction(body, 'yape-mobile');
  }

  @Post('white-label/yape/web')
  @ApiOperation({ summary: 'White Label · Válida · Yape One Shot Web' })
  @ApiResponse({ status: 200, type: PayinTransactionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @HttpCode(200)
  @TraceNode({ name: 'monnet.payin.createYapeWeb', type: 'controller' })
  createYapeWeb(@Body() body: PayinCreateYapeWebDto) {
    return this.payinService.createTransaction(body, 'yape-web');
  }
}
