import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GoogleGenAI } from '@google/genai';
import {
  ConsultantCaseStudyDto,
  ConsultantEducationDto,
} from '@modules/admin/consultant/dto/consultant-profile-fields.dto';
import { ConsultantCvProfileResultDto } from './dto/consultant-cv/consultant-cv-profile-result.dto';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';

type UnknownRecord = Record<string, unknown>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai?: GoogleGenAI;

  private getAiClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        this.logger.error('GEMINI_API_KEY no configurado en variables de entorno');
        throw new InternalServerErrorException('Error de configuración del servicio de IA (falta la clave API de Gemini)');
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  async runPrompt(text: string, prompt?: string): Promise<{ result: string }> {
    const defaultPrompt = 'Genera un resumen ejecutivo en texto plano, corrido y fluido de la reunión (en párrafos cohesivos, sin viñetas, sin listas de tareas y sin divisiones artificiales) en español.';
    const activePrompt = prompt || defaultPrompt;

    const model = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash-lite';
    const combinedPrompt = `${activePrompt}\n\n# Texto a procesar:\n${text}`;

    try {
      const interaction = await this.getAiClient().interactions.create({
        model,
        input: combinedPrompt,
        tools: [
          {
            type: 'google_search',
          },
        ],
        generation_config: {
          temperature: 1,
          max_output_tokens: 65536,
          top_p: 0.95,
        },
      }) as any;

      let resultText = '';

      // 1. Intentar obtener el texto del último paso (como interaction.steps?.at(-1))
      const lastStep = interaction.steps?.at(-1);
      if (lastStep) {
        if (lastStep.model_turn?.parts?.[0]?.text) {
          resultText = lastStep.model_turn.parts[0].text;
        } else if (lastStep.text) {
          resultText = lastStep.text;
        } else if (typeof lastStep === 'string') {
          resultText = lastStep;
        }
      }

      // 2. Fallback al array de outputs si steps no tiene texto directo
      if (!resultText && Array.isArray(interaction.outputs)) {
        for (const output of interaction.outputs) {
          if (output.type === 'text' && output.text) {
            resultText += output.text;
          }
        }
      }

      // 3. Fallback a propiedades estándar del SDK
      if (!resultText) {
        resultText = interaction.text || interaction.output_text || '';
      }

      // 4. Registrar uso de tokens
      if (interaction.usage) {
        const inputTokens = interaction.usage.total_input_tokens ?? 0;
        const outputTokens = interaction.usage.total_output_tokens ?? 0;
        const totalTokens = interaction.usage.total_tokens ?? 0;
        this.logger.log(
          `Tokens consumidos - Entrada: ${inputTokens} | Salida: ${outputTokens} | Total: ${totalTokens}`
        );
      }

      return { result: resultText };
    } catch (error: unknown) {
      const message = this.errorMessage(error);
      this.logger.error(`Error al ejecutar prompt con Gemini: ${message}`);
      throw new InternalServerErrorException(
        `Error al comunicarse con el proveedor de IA (${message})`,
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
        `Error al procesar/parsear JSON de Groq AI: ${this.errorMessage(error)}. Respuesta recibida: ${result}`,
      );
      return {
        summary: result,
        tasks: [],
      };
    }
  }

  async runConsultantCvPrompt(text: string, prompt?: string): Promise<ConsultantCvProfileResultDto> {
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
    const { result } = await this.runPrompt(text, activePrompt);
    const parsed = this.parseJsonObject(result);
    const normalized = this.normalizeConsultantCvProfile(parsed);
    await this.validateConsultantCvProfile(normalized);
    return normalized;
  }

  private parseJsonObject(value: string): UnknownRecord {
    const jsonMatch = value.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new BadRequestException(['La IA no devolvió un JSON válido para el perfil del consultor']);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]) as unknown;
    } catch {
      throw new BadRequestException(['La IA devolvió un JSON mal formado para el perfil del consultor']);
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
      throw new BadRequestException(['La IA devolvió un perfil con formato inválido']);
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
