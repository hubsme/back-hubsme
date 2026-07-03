import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AiService } from './ai.service';
import { HubsmeAiRunDto } from './dto/hubsme-ai/hubsme-ai-run.dto';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';
import { ConsultantCvRunDto } from './dto/consultant-cv/consultant-cv-run.dto';
import { ConsultantCvProfileResultDto } from './dto/consultant-cv/consultant-cv-profile-result.dto';

@ApiTags('ia')
@Controller('admin/ia')
@ApiBearerAuth()
export class IaController {
  constructor(private readonly aiService: AiService) {}

  @Post('hubsme-ai')
  @ApiOperation({ summary: 'Ejecutar flujo de IA con Groq para obtener resumen y tareas sugeridas' })
  @ApiResponse({ status: 201, type: HubsmeAiResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async runHubsmeAi(@Body() runDto: HubsmeAiRunDto): Promise<HubsmeAiResultDto> {
    return this.aiService.runHubsmeAiPrompt(runDto.text, runDto.prompt);
  }

  @Post('consultant-cv')
  @ApiOperation({ summary: 'Extraer perfil estructurado de consultor desde texto de CV usando Groq' })
  @ApiResponse({ status: 201, type: ConsultantCvProfileResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async runConsultantCv(@Body() runDto: ConsultantCvRunDto): Promise<ConsultantCvProfileResultDto> {
    return this.aiService.runConsultantCvPrompt(runDto.text, runDto.prompt);
  }
}
