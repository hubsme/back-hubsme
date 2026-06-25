import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { WhatsappSendResultDto } from './dto/whatsapp-send-result.dto';
import { WhatsappService } from './whatsapp.service';

@ApiTags('whatsapp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar un mensaje por WhatsApp' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  async sendMessage(@Body() sendMessageDto: WhatsappSendDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendMessage(sendMessageDto);
  }
}
