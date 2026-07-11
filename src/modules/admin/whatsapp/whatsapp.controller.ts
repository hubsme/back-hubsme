import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { WhatsappSendResultDto } from './dto/whatsapp-send-result.dto';
import { WhatsappNotificacionPymeDto } from './dto/whatsapp-notificacion-pyme.dto';
import { WhatsappNotificacionConsultorDto } from './dto/whatsapp-notificacion-consultor.dto';
import { WhatsappAlertaReunionConsultorDto } from './dto/whatsapp-alerta-reunion-consultor.dto';
import { WhatsappAlertaReunionDto } from './dto/whatsapp-alerta-reunion.dto';
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

  @Post('notificacion-pyme')
  @ApiOperation({ summary: 'Enviar plantilla notificacion_pyme' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  async sendNotificacionPyme(@Body() dto: WhatsappNotificacionPymeDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendNotificacionPyme(dto.to, dto);
  }

  @Post('notificacion-consultor')
  @ApiOperation({ summary: 'Enviar plantilla notificacion_consultor' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  async sendNotificacionConsultor(@Body() dto: WhatsappNotificacionConsultorDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendNotificacionConsultor(dto.to, dto);
  }

  @Post('alerta-reunion-consultor')
  @ApiOperation({ summary: 'Enviar plantilla alerta_de_reunion_consultor' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  async sendAlertaReunionConsultor(@Body() dto: WhatsappAlertaReunionConsultorDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendAlertaReunionConsultor(dto.to, dto);
  }

  @Post('alerta-reunion-pyme')
  @ApiOperation({ summary: 'Enviar plantilla alerta_de_reunion_pyme' })
  @ApiResponse({ status: 201, type: WhatsappSendResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  async sendAlertaReunionPyme(@Body() dto: WhatsappAlertaReunionDto): Promise<WhatsappSendResultDto> {
    return this.whatsappService.sendAlertaReunionPyme(dto.to, dto);
  }
}
