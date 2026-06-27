import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ConsultantCaseStudyDto,
  ConsultantEducationDto,
} from '@modules/admin/consultant/dto/consultant-profile-fields.dto';
import { ConsultantCvProfileResultDto } from './dto/consultant-cv/consultant-cv-profile-result.dto';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';

type UnknownRecord = Record<string, unknown>;

@Injectable()
export class PowerAutomateService {
  private readonly logger = new Logger(PowerAutomateService.name);
  private readonly workflowUrl = 'https://aa50c4112851ede8b0a69e71b5bf72.e4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/50a2be3614d84f94a69a55e4aec13362/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-Z930_es4R6VpwUkyJmg_jmisTBP7ZvSr2FcPig6oz0';

  async runPrompt(text: string, prompt?: string): Promise<{ result: string }> {
    const defaultPrompt = 'Genera un resumen ejecutivo en texto plano, corrido y fluido de la reunión (en párrafos cohesivos, sin viñetas, sin listas de tareas y sin divisiones artificiales) en español.';
    const activePrompt = prompt || defaultPrompt;

    return this.runPromptWithUrl(this.workflowUrl, text, activePrompt);
  }

  private async runPromptWithUrl(workflowUrl: string, text: string, prompt: string): Promise<{ result: string }> {
    const combinedPrompt = `${prompt}\n\n# Texto a procesar:\n${text}`;

    try {
      const response = await fetch(workflowUrl, {
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

      const data = (await response.json()) as unknown;
      return { result: this.readWorkflowResult(data) };
    } catch (error: unknown) {
      const message = this.errorMessage(error);
      this.logger.error(`Error al ejecutar el flujo de Power Automate: ${message}`);
      throw new InternalServerErrorException(
        `Error al comunicarse con Power Automate (${message})`,
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
    } catch (error: unknown) {
      this.logger.error(
        `Error al procesar/parsear JSON de Copilot AI: ${this.errorMessage(error)}. Respuesta recibida: ${result}`,
      );
      // Fallback seguro en caso de error de parseo
      return {
        summary: result,
        tasks: [],
      };
    }
  }

  async runConsultantCvPrompt(text: string, prompt?: string): Promise<ConsultantCvProfileResultDto> {
    const workflowUrl = 'https://aa50c4112851ede8b0a69e71b5bf72.e4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/50a2be3614d84f94a69a55e4aec13362/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-Z930_es4R6VpwUkyJmg_jmisTBP7ZvSr2FcPig6oz0';

    const defaultPrompt =
      'Analiza el texto de CV de un consultor para PYMES y extrae un perfil estructurado.\n' +
      'No inventes datos. Si un dato no aparece, usa string vacio, array vacio o 0 segun corresponda.\n' +
      'Devuelve UNICAMENTE un JSON valido, sin markdown ni explicaciones, con esta estructura exacta:\n' +
      '{\n' +
      '  "firstName": "",\n' +
      '  "lastName": "",\n' +
      '  "fullName": "",\n' +
      '  "headline": "",\n' +
      '  "location": "",\n' +
      '  "workModality": "",\n' +
      '  "bio": "",\n' +
      '  "ownerPhone": "",\n' +
      '  "linkedinUrl": "",\n' +
      '  "specialties": [],\n' +
      '  "sectors": [],\n' +
      '  "industries": [],\n' +
      '  "companyTypes": [],\n' +
      '  "services": [],\n' +
      '  "yearsExperience": 0,\n' +
      '  "education": [{ "degree": "", "institution": "", "year": "" }],\n' +
      '  "certifications": [],\n' +
      '  "workedSectors": [],\n' +
      '  "caseStudies": [{ "title": "", "problem": "", "action": "", "result": "", "sector": "" }]\n' +
      '}\n' +
      'El headline debe ser una frase corta profesional. El bio debe resumir experiencia, enfoque y valor para PYMES en maximo 500 caracteres.';

    const activePrompt = prompt || defaultPrompt;
    const { result } = await this.runPromptWithUrl(workflowUrl, text, activePrompt);
    const parsed = this.parseJsonObject(result);
    const normalized = this.normalizeConsultantCvProfile(parsed);
    await this.validateConsultantCvProfile(normalized);
    return normalized;
  }

  private readWorkflowResult(data: unknown) {
    if (typeof data === 'string') return data;
    if (!this.isRecord(data)) return '';

    const result = data.result ?? data.text ?? data.response ?? data.content;
    if (typeof result === 'string') return result;
    if (this.isRecord(result) || Array.isArray(result)) return JSON.stringify(result);

    return JSON.stringify(data);
  }

  private parseJsonObject(value: string): UnknownRecord {
    const jsonMatch = value.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new BadRequestException(['Power Automate no devolvio un JSON valido para el perfil del consultor']);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]) as unknown;
    } catch {
      throw new BadRequestException(['Power Automate devolvio un JSON mal formado para el perfil del consultor']);
    }

    if (!this.isRecord(parsed)) {
      throw new BadRequestException(['El JSON del perfil del consultor debe ser un objeto']);
    }

    return parsed;
  }

  private normalizeConsultantCvProfile(data: UnknownRecord): ConsultantCvProfileResultDto {
    return {
      firstName: this.readString(data.firstName),
      lastName: this.readString(data.lastName),
      fullName: this.readString(data.fullName),
      headline: this.readString(data.headline),
      location: this.readString(data.location),
      workModality: this.readString(data.workModality),
      bio: this.readString(data.bio),
      ownerPhone: this.readString(data.ownerPhone),
      linkedinUrl: this.readString(data.linkedinUrl),
      specialties: this.readStringArray(data.specialties),
      sectors: this.readStringArray(data.sectors),
      industries: this.readStringArray(data.industries),
      companyTypes: this.readStringArray(data.companyTypes),
      services: this.readStringArray(data.services),
      yearsExperience: this.readNumber(data.yearsExperience),
      education: this.normalizeEducation(data.education),
      certifications: this.readStringArray(data.certifications),
      workedSectors: this.readStringArray(data.workedSectors),
      caseStudies: this.normalizeCaseStudies(data.caseStudies),
    };
  }

  private async validateConsultantCvProfile(data: ConsultantCvProfileResultDto) {
    const instance = plainToInstance(ConsultantCvProfileResultDto, data);
    const errors = await validate(instance, { whitelist: true });
    if (errors.length) {
      throw new BadRequestException(['Power Automate devolvio un perfil con formato invalido']);
    }
  }

  private normalizeEducation(value: unknown): ConsultantEducationDto[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is UnknownRecord => this.isRecord(item))
      .map((item) => ({
        degree: this.readString(item.degree),
        institution: this.readString(item.institution) || undefined,
        year: this.readString(item.year) || undefined,
      }))
      .filter((item) => item.degree);
  }

  private normalizeCaseStudies(value: unknown): ConsultantCaseStudyDto[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is UnknownRecord => this.isRecord(item))
      .map((item) => ({
        title: this.readString(item.title),
        problem: this.readString(item.problem) || undefined,
        action: this.readString(item.action) || undefined,
        result: this.readString(item.result) || undefined,
        sector: this.readString(item.sector) || undefined,
      }))
      .filter((item) => item.title);
  }

  private readString(value: unknown) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  }

  private readStringArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
  }

  private readNumber(value: unknown) {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : 0;
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
