import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { User } from '@db/tables/user.table';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { HubsmeAiRunDto } from './dto/hubsme-ai/hubsme-ai-run.dto';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';
import { ConsultantCvRunDto } from './dto/consultant-cv/consultant-cv-run.dto';
import { ConsultantCvProfileResultDto } from './dto/consultant-cv/consultant-cv-profile-result.dto';
import { ServiceConsultantMatchRunDto } from './dto/service-request/service-consultant-match-run.dto';
import { ServiceConsultantMatchesResultDto } from './dto/service-request/service-consultant-match-result.dto';
import { ServiceRequestChatRunDto } from './dto/service-request/service-request-chat-run.dto';
import { ServiceRequestChatResultDto } from './dto/service-request/service-request-chat-result.dto';

type AuthenticatedRequest = { user: User };

@ApiTags('ia')
@Controller('admin/ia')
@ApiBearerAuth()
export class IaController {
  constructor(private readonly aiService: AiService) {}

  @Post('hubsme-ai')
  @ApiOperation({ summary: 'Ejecutar flujo de IA con Gemini para obtener resumen y tareas sugeridas' })
  @ApiResponse({ status: 201, type: HubsmeAiResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async runHubsmeAi(@Body() runDto: HubsmeAiRunDto): Promise<HubsmeAiResultDto> {
    return this.aiService.runHubsmeAiPrompt(runDto.text, runDto.prompt);
  }

  @Post('consultant-cv')
  @ApiOperation({ summary: 'Extraer perfil estructurado de consultor desde texto de CV usando Gemini' })
  @ApiResponse({ status: 201, type: ConsultantCvProfileResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async runConsultantCv(@Body() runDto: ConsultantCvRunDto): Promise<ConsultantCvProfileResultDto> {
    return this.aiService.runConsultantCvPrompt(runDto.text, runDto.prompt);
  }

  @Post('service-request-chat')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Continuar el asistente conversacional para definir un servicio' })
  @ApiResponse({ status: 201, type: ServiceRequestChatResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  async runServiceRequestChat(
    @Body() runDto: ServiceRequestChatRunDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<ServiceRequestChatResultDto> {
    return this.aiService.runServiceRequestChat(runDto, request.user);
  }

  @Post('service-consultant-matches')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Recomendar exactamente 3 consultores para una solicitud de servicio' })
  @ApiResponse({ status: 201, type: ServiceConsultantMatchesResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  async runServiceConsultantMatches(
    @Body() runDto: ServiceConsultantMatchRunDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<ServiceConsultantMatchesResultDto> {
    return this.aiService.runServiceConsultantMatches(runDto, request.user);
  }
}
