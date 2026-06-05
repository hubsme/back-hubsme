import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';

@Injectable()
export class PowerAutomateService {
  private readonly logger = new Logger(PowerAutomateService.name);
  private readonly workflowUrl = 'https://aa50c4112851ede8b0a69e71b5bf72.e4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/50a2be3614d84f94a69a55e4aec13362/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-Z930_es4R6VpwUkyJmg_jmisTBP7ZvSr2FcPig6oz0';

  async runPrompt(text: string, prompt?: string): Promise<{ result: string }> {
    const defaultPrompt = 'Genera un resumen ejecutivo en texto plano, corrido y fluido de la reunión (en párrafos cohesivos, sin viñetas, sin listas de tareas y sin divisiones artificiales) en español.';
    const activePrompt = prompt || defaultPrompt;

    const combinedPrompt = `${activePrompt}\n\n# Transcripción a procesar:\n${text}`;

    try {
      const response = await fetch(this.workflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: combinedPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Power Automate respondió con estado ${response.status}`);
      }

      const data = (await response.json()) as { result?: string };
      return { result: data.result || '' };
    } catch (error: any) {
      this.logger.error(`Error al ejecutar el flujo de Power Automate: ${error.message || error}`);
      throw new InternalServerErrorException(
        `Error al comunicarse con Power Automate (${error.message || error})`,
      );
    }
  }

  async runHubsmeAiPrompt(text: string, prompt?: string): Promise<HubsmeAiResultDto> {
    const defaultCopilotAiPrompt =
      'Analiza la siguiente transcripción de reunión de consultoría y redacta un ACTA DE REUNIÓN, no un resumen narrativo.\n' +
      'El acta debe ser objetiva, verificable, breve en deliberaciones y fuerte en acuerdos. Debe conservar decisiones, acuerdos, responsables, fechas, pendientes y próximos pasos.\n' +
      'Estructura el campo summary en Markdown con estos apartados: # Acta de reunion, ## Datos de la sesion, ## Asistentes mencionados, ## Orden del dia o temas tratados, ## Deliberaciones principales, ## Acuerdos y decisiones, ## Compromisos de la PYME, ## Pendientes y riesgos, ## Proxima reunion, ## Cierre.\n' +
      'Si un dato no aparece en la transcripción, escribe "No especificado" en vez de inventarlo.\n' +
      'Extrae tareas accionables SOLO para la PYME. No crees tareas asignadas al consultor. Si un compromiso corresponde al consultor, registralo dentro del acta como acuerdo o pendiente, pero no lo devuelvas en tasks.\n\n' +
      'Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura y en español:\n' +
      '{\n' +
      '  "summary": "Markdown completo del acta aquí...",\n' +
      '  "tasks": [\n' +
      '    {\n' +
      '      "title": "Título accionable para la PYME...",\n' +
      '      "description": "Descripción detallada del compromiso de la PYME...",\n' +
      '      "assignedTo": "pyme",\n' +
      '      "priority": "alta", "media" o "baja",\n' +
      '      "dueDate": "YYYY-MM-DD" o null\n' +
      '    }\n' +
      '  ]\n' +
      '}\n' +
      'No incluyas introducciones, explicaciones ni bloques de código markdown (como ```json). Solo devuelve el JSON puro.';

    const activePrompt = prompt || defaultCopilotAiPrompt;
    const { result } = await this.runPrompt(text, activePrompt);

    try {
      // Regex para capturar el primer bloque JSON {...} en la respuesta (por si hay texto antes o después)
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró un bloque JSON válido en la respuesta de la IA.');
      }

      const parsed = JSON.parse(jsonMatch[0]) as HubsmeAiResultDto;
      return {
        summary: parsed.summary || '',
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter((task) => task.assignedTo === 'pyme') : [],
      };
    } catch (error: any) {
      this.logger.error(
        `Error al procesar/parsear JSON de Copilot AI: ${error.message || error}. Respuesta recibida: ${result}`,
      );
      // Fallback seguro en caso de error de parseo
      return {
        summary: result,
        tasks: [],
      };
    }
  }
}
