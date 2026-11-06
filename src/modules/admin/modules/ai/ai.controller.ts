import { TraceNode } from '@erixcel/traceflow';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { AiService } from '@modules/admin/modules/ai/ai.service';
import { HubsmeAiRunDto } from '@modules/admin/modules/ai/dto/run-hubsme-ai.dto';
import { HubsmeAiResultDto } from '@modules/admin/modules/ai/dto/run-hubsme-ai.dto';
import { ConsultantCvRunDto } from '@modules/admin/modules/ai/dto/run-consultant-cv.dto';
import { ConsultantCvProfileResultDto } from '@modules/admin/modules/ai/dto/run-consultant-cv.dto';
import { ServiceConsultantMatchRunDto } from '@modules/admin/modules/ai/dto/run-service-consultant-matches.dto';
import { ServiceConsultantMatchesResultDto } from '@modules/admin/modules/ai/dto/run-service-consultant-matches.dto';
import { ServiceRequestChatRunDto } from '@modules/admin/modules/ai/dto/run-service-request-chat.dto';
import { ServiceRequestChatResultDto } from '@modules/admin/modules/ai/dto/run-service-request-chat.dto';
import { ServicePaymentPlanRunDto } from '@modules/admin/modules/ai/dto/run-service-payment-plan.dto';
import { ServicePaymentPlanResultDto } from '@modules/admin/modules/ai/dto/run-service-payment-plan.dto';

@ApiTags('ia')
@Controller('admin/ia')
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('hubsme-ai')
  @ApiOperation({
    operationId: 'IaController_runHubsmeAi',
    summary: 'Ejecutar flujo de IA con Gemini para obtener resumen y tareas sugeridas',
  })
  @ApiResponse({ status: 201, type: HubsmeAiResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'runHubsmeAi', type: 'controller' })
  async runHubsmeAi(@Body() runDto: HubsmeAiRunDto): Promise<HubsmeAiResultDto> {
    return this.aiService.runHubsmeAiPrompt(runDto.text, runDto.prompt);
  }

  @Post('consultant-cv')
  @ApiOperation({
    operationId: 'IaController_runConsultantCv',
    summary: 'Extraer perfil estructurado de consultor desde texto de CV usando Gemini',
  })
  @ApiResponse({ status: 201, type: ConsultantCvProfileResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'runConsultantCv', type: 'controller' })
  async runConsultantCv(@Body() runDto: ConsultantCvRunDto): Promise<ConsultantCvProfileResultDto> {
    return this.aiService.runConsultantCvPrompt(runDto.text, runDto.prompt);
  }

  @Post('service-request-chat')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    operationId: 'IaController_runServiceRequestChat',
    summary: 'Continuar el asistente conversacional para definir un servicio',
  })
  @ApiResponse({ status: 201, type: ServiceRequestChatResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  @TraceNode({ name: 'runServiceRequestChat', type: 'controller' })
  async runServiceRequestChat(
    @Body() runDto: ServiceRequestChatRunDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<ServiceRequestChatResultDto> {
    return this.aiService.runServiceRequestChat(runDto, request.user);
  }

  @Post('service-payment-plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    operationId: 'IaController_runServicePaymentPlan',
    summary: 'Recomendar con IA la estructura de pagos de una solicitud de servicio',
  })
  @ApiResponse({ status: 201, type: ServicePaymentPlanResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  @TraceNode({ name: 'runServicePaymentPlan', type: 'controller' })
  async runServicePaymentPlan(
    @Body() runDto: ServicePaymentPlanRunDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<ServicePaymentPlanResultDto> {
    return this.aiService.runServicePaymentPlan(runDto, request.user);
  }

  @Post('service-consultant-matches')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    operationId: 'IaController_runServiceConsultantMatches',
    summary: 'Recomendar exactamente 3 consultores para una solicitud de servicio',
  })
  @ApiResponse({ status: 201, type: ServiceConsultantMatchesResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  @TraceNode({ name: 'runServiceConsultantMatches', type: 'controller' })
  async runServiceConsultantMatches(
    @Body() runDto: ServiceConsultantMatchRunDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<ServiceConsultantMatchesResultDto> {
    return this.aiService.runServiceConsultantMatches(runDto, request.user);
  }
}
