import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { PowerAutomateService } from './powerautomate.service';
import { HubsmeAiRunDto } from './dto/hubsme-ai/hubsme-ai-run.dto';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';
import { ConsultantCvRunDto } from './dto/consultant-cv/consultant-cv-run.dto';
import { ConsultantCvProfileResultDto } from './dto/consultant-cv/consultant-cv-profile-result.dto';

@ApiTags('powerautomate')
@Controller('admin/powerautomate')
export class PowerAutomateController {
  constructor(private readonly powerAutomateService: PowerAutomateService) {}

  @Post('hubsme-ai')
  @ApiOperation({ summary: 'Ejecutar flujo de Power Automate para obtener resumen y tareas sugeridas' })
  @ApiResponse({ status: 201, type: HubsmeAiResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async runHubsmeAi(@Body() runDto: HubsmeAiRunDto): Promise<HubsmeAiResultDto> {
    return this.powerAutomateService.runHubsmeAiPrompt(runDto.text, runDto.prompt);
  }

  @Post('consultant-cv')
  @ApiOperation({ summary: 'Extraer perfil estructurado de consultor desde texto de CV' })
  @ApiResponse({ status: 201, type: ConsultantCvProfileResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  async runConsultantCv(@Body() runDto: ConsultantCvRunDto): Promise<ConsultantCvProfileResultDto> {
    return this.powerAutomateService.runConsultantCvPrompt(runDto.text, runDto.prompt);
  }
}
