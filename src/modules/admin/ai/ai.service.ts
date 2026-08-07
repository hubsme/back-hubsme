import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FunctionCallingConfigMode, FunctionDeclaration, GoogleGenAI } from '@google/genai';
import { User } from '@db/tables/user.table';
import {
  SERVICE_REQUEST_BUDGET_TYPES,
  SERVICE_REQUEST_CATEGORIES,
  SERVICE_REQUEST_CATEGORY_OPTIONS,
} from '@db/tables/service-request.table';
import {
  ConsultantCaseStudyDto,
  ConsultantEducationDto,
} from '@modules/admin/consultant/dto/consultant-profile-fields.dto';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantCvProfileResultDto } from './dto/consultant-cv/consultant-cv-profile-result.dto';
import { HubsmeAiResultDto } from './dto/hubsme-ai/hubsme-ai-result.dto';
import { ServiceConsultantMatchRunDto } from './dto/service-request/service-consultant-match-run.dto';
import {
  ServiceConsultantMatchDto,
  ServiceConsultantMatchesResultDto,
} from './dto/service-request/service-consultant-match-result.dto';
import { ServiceRequestChatRunDto } from './dto/service-request/service-request-chat-run.dto';
import { ServiceRequestChatResultDto } from './dto/service-request/service-request-chat-result.dto';
import {
  ServiceRequestDraftDto,
  ServiceRequestMilestoneDraftDto,
} from './dto/service-request/service-request-draft.dto';

type UnknownRecord = Record<string, unknown>;
type RunPromptOptions = {
  useGoogleSearch?: boolean;
  temperature?: number;
  responseJsonSchema?: UnknownRecord;
};
type ServiceChatMessage = { role: 'assistant' | 'user'; content: string };
type ServiceRequestEvaluation = {
  phase: ServiceRequestChatResultDto['phase'];
  isComplete: boolean;
  needsConfirmation: boolean;
  userConfirmedReview: boolean;
  missingInformation: string[];
  nextFocus: string;
};
type ConsultantMatchCandidate = Awaited<ReturnType<ConsultantRepository['findAvailableForAiMatching']>>[number];

const SERVICE_REQUEST_SUBCATEGORIES = SERVICE_REQUEST_CATEGORY_OPTIONS.flatMap((option) => option.subcategories);

const SERVICE_REQUEST_DRAFT_SCHEMA: UnknownRecord = {
  type: 'object',
  additionalProperties: false,
  propertyOrdering: [
    'title',
    'category',
    'subcategory',
    'description',
    'expectedOutcome',
    'requirements',
    'deliverables',
    'exclusions',
    'referenceUrls',
    'budgetType',
    'budgetMin',
    'budgetMax',
    'deadline',
    'estimatedDuration',
    'workModality',
    'workMethod',
    'milestones',
    'details',
  ],
  properties: {
    title: { type: 'string', minLength: 3 },
    category: { type: 'string', enum: SERVICE_REQUEST_CATEGORIES },
    subcategory: { type: 'string', enum: SERVICE_REQUEST_SUBCATEGORIES },
    description: { type: 'string' },
    expectedOutcome: { type: 'string' },
    requirements: { type: 'string' },
    deliverables: { type: 'array', maxItems: 20, items: { type: 'string' } },
    exclusions: { type: 'string' },
    referenceUrls: { type: 'array', maxItems: 10, items: { type: 'string' } },
    budgetType: { type: 'string', enum: ['', ...SERVICE_REQUEST_BUDGET_TYPES] },
    budgetMin: { type: 'string' },
    budgetMax: { type: 'string' },
    deadline: { type: 'string' },
    estimatedDuration: { type: 'string' },
    workModality: { type: 'string', enum: ['remote'] },
    workMethod: { type: 'string' },
    milestones: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          dueDate: { type: 'string' },
        },
        required: ['title', 'dueDate'],
      },
    },
    details: { type: 'string' },
  },
  required: [
    'title',
    'category',
    'subcategory',
    'description',
    'expectedOutcome',
    'requirements',
    'deliverables',
    'exclusions',
    'referenceUrls',
    'budgetType',
    'budgetMin',
    'budgetMax',
    'deadline',
    'estimatedDuration',
    'workModality',
    'workMethod',
    'milestones',
    'details',
  ],
};

const SERVICE_REQUEST_DRAFT_EXTRACTION_SCHEMA: UnknownRecord = {
  type: 'object',
  additionalProperties: false,
  properties: {
    draft: SERVICE_REQUEST_DRAFT_SCHEMA,
  },
  required: ['draft'],
};

const SERVICE_REQUEST_EVALUATION_SCHEMA: UnknownRecord = {
  type: 'object',
  additionalProperties: false,
  propertyOrdering: ['readyForConfirmation', 'userConfirmedReview', 'missingInformation', 'nextFocus'],
  properties: {
    readyForConfirmation: { type: 'boolean' },
    userConfirmedReview: { type: 'boolean' },
    missingInformation: {
      type: 'array',
      maxItems: 12,
      items: { type: 'string' },
    },
    nextFocus: { type: 'string' },
  },
  required: ['readyForConfirmation', 'userConfirmedReview', 'missingInformation', 'nextFocus'],
};

const SERVICE_REQUEST_RESPONSE_SCHEMA: UnknownRecord = {
  type: 'object',
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai?: GoogleGenAI;

  constructor(private readonly consultantRepository: ConsultantRepository) {}

  private getAiClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        this.logger.error('GEMINI_API_KEY no configurado en variables de entorno');
        throw new InternalServerErrorException(
          'Error de configuración del servicio de IA (falta la clave API de Gemini)',
        );
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  async runPrompt(text: string, prompt?: string, options: RunPromptOptions = {}): Promise<{ result: string }> {
    const defaultPrompt =
      'Genera un resumen ejecutivo en texto plano, corrido y fluido de la reunión (en párrafos cohesivos, sin viñetas, sin listas de tareas y sin divisiones artificiales) en español.';
    const activePrompt = prompt || defaultPrompt;

    const model = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash-lite';
    const combinedPrompt = `${activePrompt}\n\n# Texto a procesar:\n${text}`;

    try {
      if (options.responseJsonSchema) {
        const response = await this.getAiClient().models.generateContent({
          model,
          contents: combinedPrompt,
          config: {
            temperature: options.temperature ?? 0.35,
            maxOutputTokens: 8192,
            topP: 0.95,
            responseMimeType: 'application/json',
            responseJsonSchema: options.responseJsonSchema,
          },
        });
        const usage = response.usageMetadata;
        if (usage) {
          this.logger.log(
            `Tokens consumidos - Entrada: ${usage.promptTokenCount ?? 0} | Salida: ${usage.candidatesTokenCount ?? 0} | Total: ${usage.totalTokenCount ?? 0}`,
          );
        }
        return { result: response.text ?? '' };
      }

      const interaction = (await this.getAiClient().interactions.create({
        model,
        input: combinedPrompt,
        ...(options.useGoogleSearch === false
          ? {}
          : {
              tools: [
                {
                  type: 'google_search' as const,
                },
              ],
            }),
        generation_config: {
          temperature: options.temperature ?? 1,
          max_output_tokens: 65536,
          top_p: 0.95,
        },
      })) as any;

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
          `Tokens consumidos - Entrada: ${inputTokens} | Salida: ${outputTokens} | Total: ${totalTokens}`,
        );
      }

      return { result: resultText };
    } catch (error: unknown) {
      const message = this.errorMessage(error);
      this.logger.error(`Error al ejecutar prompt con Gemini: ${message}`);
      throw new InternalServerErrorException(`Error al comunicarse con el proveedor de IA (${message})`);
    }
  }

  async runHubsmeAiPrompt(text: string, prompt?: string): Promise<HubsmeAiResultDto> {
    const defaultCopilotAiPrompt =
      'Analiza la siguiente transcripción de reunión de consultoría y redacta un ACTA DE REUNIÓN, no un resumen narrativo.\n' +
      'El acta debe ser objetiva, verificable, breve en deliberaciones y fuerte en acuerdos. Debe conservar decisiones, acuerdos, responsables, fechas, pendientes y próximos pasos.\n' +
      'Estructura el campo summary en Markdown con estos apartados: # Acta de reunion, ## Datos de la sesion, ## Asistentes mencionados, ## Orden del dia o temas tratados, ## Deliberaciones principales, ## Acuerdos y decisiones, ## Compromisos de la PYME, ## Pendientes y riesgos, ## Proxima reunion, ## Cierre.\n' +
      'La entrada puede comenzar con DATOS VERIFICADOS DE LA REUNIÓN. Esos datos tienen prioridad sobre la transcripción: usa la fecha y hora de la primera grabación y registra Microsoft Teams como lugar cuando se indique. Para fecha y hora usa siempre la referencia de Perú (America/Lima), con formato am/pm; no muestres UTC.\n' +
      'Si un dato no aparece en la transcripción, escribe "No especificado" en vez de inventarlo.\n' +
      'Extrae todas las tareas accionables que se desprendan de la reunión, tanto para la PYME como para el consultor cuando corresponda. Usa assignedTo="pyme" o assignedTo="consultor" según el responsable explícito. No inventes tareas ni responsables; si no hay tareas, devuelve un arreglo vacío.\n\n' +
      'Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura y en español:\n' +
      '{\n' +
      '  "summary": "Markdown completo del acta aquí...",\n' +
      '  "tasks": [\n' +
      '    {\n' +
      '      "title": "Título accionable...",\n' +
      '      "description": "Descripción detallada del compromiso...",\n' +
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

      const parsed = JSON.parse(jsonMatch[0]) as Partial<HubsmeAiResultDto>;
      return {
        summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : '.',
        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks
              .map((task) => this.normalizeTaskSuggestion(task))
              .filter((task): task is HubsmeAiResultDto['tasks'][number] => task !== null)
          : [],
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error al procesar/parsear JSON de Groq AI: ${this.errorMessage(error)}. Respuesta recibida: ${result}`,
      );
      return {
        summary: result.trim() || '.',
        tasks: [],
      };
    }
  }

  private normalizeTaskSuggestion(value: unknown): HubsmeAiResultDto['tasks'][number] | null {
    if (typeof value !== 'object' || value === null) return null;

    const task = value as UnknownRecord;
    const assignedTo = task.assignedTo === 'consultor' ? 'consultor' : 'pyme';
    const priority = task.priority === 'alta' || task.priority === 'baja' ? task.priority : 'media';
    const dueDate =
      typeof task.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) ? task.dueDate : undefined;

    return {
      title: typeof task.title === 'string' && task.title.trim() ? task.title.trim() : 'Pendiente de la reunión',
      description: typeof task.description === 'string' && task.description.trim() ? task.description.trim() : '.',
      assignedTo,
      priority,
      ...(dueDate ? { dueDate } : {}),
    };
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
      '  "workModality": "remote",\n' +
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
      'workModality siempre debe ser exactamente "remote", porque por el momento la plataforma solo admite consultoría remota. ' +
      'El headline debe ser una frase corta profesional. El bio debe resumir experiencia, enfoque y valor para PYMES en maximo 500 caracteres.';

    const activePrompt = prompt || defaultPrompt;
    const { result } = await this.runPrompt(text, activePrompt);
    const parsed = this.parseJsonObject(result);
    const normalized = this.normalizeConsultantCvProfile(parsed);
    await this.validateConsultantCvProfile(normalized);
    return normalized;
  }

  async runServiceRequestChat(data: ServiceRequestChatRunDto, currentUser: User): Promise<ServiceRequestChatResultDto> {
    this.assertPyme(currentUser);
    const conversation: ServiceChatMessage[] = data.messages
      .map((message) => ({
        role: message.role,
        content: this.readLongText(message.content, 2000),
      }))
      .filter((message) => message.content);
    if (conversation.length < 2 || conversation.at(-1)?.role !== 'user') {
      throw new BadRequestException(['La conversación debe incluir el último mensaje de la PYME']);
    }

    const latestUserMessage = conversation.at(-1)?.content ?? '';
    const previousAssistantMessage =
      [...conversation].reverse().find((message) => message.role === 'assistant')?.content ?? '';
    const recentAssistantMessages = conversation
      .filter((message) => message.role === 'assistant')
      .slice(-3)
      .map((message) => message.content);
    const latestUserMessageIsOffTopic = this.isOffTopicServiceRequestMessage(latestUserMessage);
    const currentDraft = this.normalizeServiceDraft(data.draft);
    const dateContext = this.getServiceRequestDateContext();
    const categoryCatalog = JSON.stringify(SERVICE_REQUEST_CATEGORY_OPTIONS);
    const extractionPrompt =
      'Actúas como analista de requisitos de HUBSME. Tu única tarea es mantener un borrador estructurado de la solicitud de servicio.\n' +
      `La fecha actual es ${dateContext.today} (${dateContext.formattedDate}) y la zona horaria es ${dateContext.timeZone}. Usa siempre este contexto para interpretar fechas.\n` +
      'Lee toda la conversación y currentDraft. El último mensaje de la PYME tiene prioridad para agregar o corregir datos, pero nunca borres un dato válido solo porque la respuesta del modelo no lo repitió. Conserva lo ya registrado, salvo que la PYME lo corrija de forma explícita. Interpreta cada respuesta según la pregunta inmediatamente anterior y no solo por palabras aisladas.\n' +
      'Si el último mensaje es una queja, insulto, saludo o comentario que no aporta requisitos, no lo conviertas en datos ni borres información: conserva currentDraft y deja que el asistente responda con empatía y retome el siguiente dato faltante.\n' +
      `Clasifica category y subcategory exclusivamente con este catálogo: ${categoryCatalog}. Elige la opción más cercana al problema descrito y usa siempre los valores exactos del catálogo. Nunca le preguntes a la PYME qué categoría, subcategoría o título debe usar.\n` +
      'Interpreta title a partir de la necesidad expresada y genera un nombre breve, claro y específico para el servicio. description describe solamente el problema o necesidad actual; expectedOutcome describe el resultado o meta final; requirements sintetiza el alcance a partir de la conversación, sin convertirlo en una pregunta para la PYME.\n' +
      'deliverables enumera resultados concretos y verificables que la PYME espera recibir para considerar terminado el servicio. Consolida las evidencias expresadas por la PYME en distintos turnos y no repitas la pregunta si ya existe un entregable válido. Una respuesta breve como “informe digital”, “un informe detallado” o “las facturas boleteadas” sí es una respuesta válida cuando aparece como continuación de una pregunta sobre entregables: normalízala usando el contexto, por ejemplo como un informe digital, un informe de contabilidad o comprobantes boleteados y registrados. Si la PYME todavía no dijo qué quiere recibir, deja deliverables vacío porque ese dato se preguntará explícitamente después. Nunca conviertas un ejemplo sugerido únicamente por el asistente en un entregable confirmado por la PYME.\n' +
      'exclusions registra lo que no se incluye; referenceUrls contiene enlaces externos; deadline usa YYYY-MM-DD; estimatedDuration indica cuánto durará el trabajo. Resuelve expresiones inequívocas como “fin de mes”, “el próximo viernes” o una fecha sin año usando la fecha actual. Para “antes de fin de mes”, usa el último día del mes correspondiente. Si una fecha sin año todavía no ocurrió, usa el año actual; si ya pasó, usa el siguiente.\n' +
      'Para presupuesto: “máximo X”, “hasta X” o “pagaría X como máximo” significa budgetType=fixed, budgetMin=X y budgetMax vacío. Solo usa budgetType=range cuando la PYME indique explícitamente dos límites, por ejemplo “entre X e Y” o “de X a Y”. Si responde únicamente con un monto a una pregunta de presupuesto, úsalo como fixed y reemplaza el presupuesto anterior; no combines automáticamente montos de mensajes distintos para fabricar un rango. Guarda montos sin símbolo.\n' +
      'workModality siempre es remote; workMethod explica cómo se realizará y coordinará el trabajo; milestones debe identificar de forma proactiva las etapas necesarias del servicio, nombrarlas de manera clara y asignarles fechas YYYY-MM-DD. Cuando la duración y la fecha límite sean suficientemente claras, propón hitos razonables aproximadamente cada 7 días, sin superar 20, incluyendo una etapa final de cierre si corresponde. No preguntes por los hitos como requisito obligatorio: puedes inferirlos del problema, resultado esperado, entregables, duración y fecha límite; si todavía no hay información suficiente, deja milestones vacío. details conserva restricciones u otro contexto que no encaje en los campos anteriores.\n' +
      'Una afirmación breve como “sí”, “correcto” o “así es” normalmente confirma la pregunta anterior, pero no agrega requisitos nuevos al draft.\n' +
      'Interpreta las respuestas según su contexto conversacional, no por coincidencia de palabras aisladas. Devuelve únicamente el draft estructurado solicitado por el esquema.';
    const extractionPayload = JSON.stringify({
      dateContext,
      currentDraft,
      conversation,
      latestUserMessage,
      previousAssistantMessage,
      latestUserMessageIsOffTopic,
    });
    const { result: extractionResult } = await this.runPrompt(extractionPayload, extractionPrompt, {
      useGoogleSearch: false,
      temperature: 0.1,
      responseJsonSchema: SERVICE_REQUEST_DRAFT_EXTRACTION_SCHEMA,
    });
    const extraction = this.parseServiceRequestJson(extractionResult, 'la extracción del servicio');
    const extractedDraft = this.mergeServiceDraft(currentDraft, this.normalizeServiceDraft(extraction.draft));
    const draft = this.applyExplicitUserDeliverables(extractedDraft, conversation);

    const evaluationPrompt =
      'Eres la IA evaluadora del chat de solicitudes de servicio de HUBSME. No redactes el mensaje para la PYME; determina únicamente el estado semántico de la conversación.\n' +
      `La fecha actual es ${dateContext.today} (${dateContext.formattedDate}) en ${dateContext.timeZone}. Considera válidas las fechas relativas que ya fueron resueltas en draft.\n` +
      'Evalúa el draft y toda la conversación en contexto. readyForConfirmation=true solo cuando sean suficientemente claros: problema actual, resultado esperado, entregables concretos que la PYME confirmó, presupuesto fijo o rango, fecha límite, duración estimada y forma de trabajo remoto. El título, la categoría, la subcategoría y el alcance se derivan automáticamente con IA; nunca los reportes como datos faltantes ni pidas que la PYME los defina. Si draft.deliverables contiene al menos un resultado concreto expresado o confirmado por la PYME, no marques entregables como faltantes aunque una respuesta anterior del asistente los haya vuelto a preguntar.\n' +
      'No marques como faltante un dato que ya esté definido de forma válida en draft. “Máximo X” es un presupuesto válido de tipo fixed con tope X; una fecha relativa inequívoca ya convertida a YYYY-MM-DD es válida.\n' +
      'Marca userConfirmedReview=true cuando el último mensaje de la PYME confirme semánticamente el resumen o la pregunta final inmediatamente anterior. Ejemplos válidos: “sí”, “sí así es”, “es correcto”, “confirmo” o equivalentes, siempre que el mensaje anterior realmente pidiera confirmar la solicitud completa. No lo marques si ese sí respondía una pregunta de recopilación.\n' +
      'missingInformation debe contener solo datos esenciales ausentes, ambiguos o demasiado vagos. Prioriza los entregables cuando falten: significa preguntar qué espera recibir la PYME para considerar terminado el servicio. Nunca incluyas título, categoría, subcategoría, alcance ni nombres de campos internos. No incluyas exclusiones, enlaces, archivos ni hitos porque son opcionales. Usa frases naturales en español.\n' +
      'nextFocus debe indicar el único bloque lógico que conviene preguntar después; déjalo vacío cuando readyForConfirmation=true. No redactes preguntas ni mensajes de chat.';
    const evaluationPayload = JSON.stringify({
      dateContext,
      draft,
      conversation,
      latestUserMessage,
      previousAssistantMessage,
      recentAssistantMessages,
      latestUserMessageIsOffTopic,
    });
    const { result: evaluationResult } = await this.runPrompt(evaluationPayload, evaluationPrompt, {
      useGoogleSearch: false,
      temperature: 0.1,
      responseJsonSchema: SERVICE_REQUEST_EVALUATION_SCHEMA,
    });
    const rawEvaluation = this.parseServiceRequestJson(evaluationResult, 'la evaluación del servicio');
    const evaluation = this.normalizeServiceRequestEvaluation(rawEvaluation, draft);

    const responsePrompt =
      'Eres el asistente conversacional de solicitudes de servicio de HUBSME. Genera el único mensaje que verá la PYME basándote en conversation, draft, evaluation y el último turno explícito. La respuesta debe ser natural, específica y en español.\n' +
      `La fecha actual es ${dateContext.today} (${dateContext.formattedDate}) en ${dateContext.timeZone}. Expresa fechas de forma clara en español y no vuelvas a pedir fechas o presupuestos que draft ya contiene.\n` +
      'Antes de escribir, identifica qué acaba de decir la PYME y revisa draft y evaluation. La primera frase debe reconocer o aclarar la última aportación de la PYME, salvo que sea un saludo o una queja. Nunca menciones nombres internos de campos, flags, JSON ni procesos de evaluación. No uses frases genéricas prefabricadas, no repitas literalmente el mensaje anterior del asistente y no vuelvas a preguntar algo que ya esté presente en draft.\n' +
      'Si latestUserMessageIsOffTopic=true, no lo interpretes como un requisito ni como una confirmación. Responde con empatía, reconoce brevemente la frustración o el desvío, indica el dato útil más reciente que sí quedó registrado y retoma solo el siguiente dato faltante. No regañes ni reinicies la conversación.\n' +
      'Si evaluation.phase=gathering, formula UNA sola pregunta concreta sobre evaluation.nextFocus o el primer elemento de missingInformation. Si draft ya tiene deliverables, no preguntes otra vez por entregables. Si realmente faltan, pregunta exactamente qué espera recibir al finalizar para considerar terminado el servicio; ofrece ejemplos contextualizados como informe, archivo, capacitación realizada, manual, configuración implementada o sesiones completadas. Nunca preguntes por título, categoría, subcategoría ni alcance como campos separados. Puedes agrupar únicamente datos estrechamente relacionados.\n' +
      'Si evaluation.phase=confirming, resume de manera breve los datos principales del draft y formula una sola confirmación final. En esa misma pregunta permite agregar opcionalmente exclusiones, enlaces, archivos de referencia o hitos.\n' +
      'Si evaluation.phase=complete, confirma que la solicitud quedó lista para revisar y no hagas ninguna pregunta adicional.\n' +
      'No preguntes por el consultor ni por el método de pago. Devuelve solamente el mensaje solicitado por el esquema.';
    const responsePayload = JSON.stringify({
      dateContext,
      draft,
      conversation,
      evaluation,
      latestUserMessage,
      previousAssistantMessage,
      recentAssistantMessages,
      latestUserMessageIsOffTopic,
    });
    const { result: responseResult } = await this.runPrompt(responsePayload, responsePrompt, {
      useGoogleSearch: false,
      temperature: 0.35,
      responseJsonSchema: SERVICE_REQUEST_RESPONSE_SCHEMA,
    });
    const generatedResponse = this.parseServiceRequestJson(responseResult, 'la respuesta del asistente');
    const message = this.readLongText(generatedResponse.message, 1500);
    if (message.length < 2) {
      throw new BadRequestException(['La IA no generó una respuesta válida para la solicitud']);
    }

    const response: ServiceRequestChatResultDto = {
      message,
      phase: evaluation.phase,
      isComplete: evaluation.isComplete,
      draft,
      missingInformation: evaluation.missingInformation,
    };
    await this.validateServiceRequestChat(response);
    return response;
  }

  async runServiceConsultantMatches(
    data: ServiceConsultantMatchRunDto,
    currentUser: User,
  ): Promise<ServiceConsultantMatchesResultDto> {
    this.assertPyme(currentUser);
    const draft = this.normalizeServiceDraft(data.draft);
    const missingInformation = this.getDraftMissingInformation(draft);
    if (missingInformation.length) {
      throw new BadRequestException([
        `Completa la solicitud antes de buscar consultores: ${missingInformation.join(', ')}`,
      ]);
    }

    const candidates = await this.consultantRepository.findAvailableForAiMatching();
    if (candidates.length < 3) {
      throw new BadRequestException([
        'Se necesitan al menos 3 consultores activos y validados para generar recomendaciones',
      ]);
    }

    const functionName = 'select_best_service_consultants';
    const functionDeclaration: FunctionDeclaration = {
      name: functionName,
      description:
        'Selecciona exactamente tres consultores cuyo perfil se ajuste mejor a la solicitud de servicio de la PYME.',
      parametersJsonSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          matches: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                consultantId: { type: 'integer' },
                reason: {
                  type: 'string',
                  description: 'Razón breve y específica de la coincidencia con el servicio.',
                },
              },
              required: ['consultantId', 'reason'],
            },
          },
        },
        required: ['matches'],
      },
    };
    const prompt =
      'Analiza la solicitud y los perfiles disponibles. Prioriza primero las áreas de diagnóstico, luego especialidades, servicios, sectores, compatibilidad entre presupuesto, duración estimada y tarifa por hora, experiencia y evidencia del perfil.\n' +
      'Debes llamar a la función con exactamente 3 IDs distintos que existan en candidates. No inventes consultores. La razón debe explicar la coincidencia concreta en máximo 300 caracteres.\n\n' +
      JSON.stringify({
        serviceRequest: draft,
        candidates: candidates.map((candidate) => this.toMatchPromptCandidate(candidate)),
      });
    const args = await this.runFunctionPrompt(prompt, functionDeclaration, functionName);
    const normalized = this.normalizeConsultantMatches(args, candidates);
    await this.validateConsultantMatches(normalized);
    return normalized;
  }

  async runFunctionPrompt(
    prompt: string,
    functionDeclaration: FunctionDeclaration,
    functionName: string,
  ): Promise<UnknownRecord> {
    const model = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash-lite';
    let response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;
    try {
      response = await this.getAiClient().models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.2,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: [functionName],
            },
          },
          tools: [{ functionDeclarations: [functionDeclaration] }],
        },
      });
    } catch (error: unknown) {
      const message = this.errorMessage(error);
      this.logger.error(`Error al ejecutar función con Gemini: ${message}`);
      throw new InternalServerErrorException(`Error al comunicarse con el proveedor de IA (${message})`);
    }

    const functionCall = response.functionCalls?.find((call) => call.name === functionName);
    if (!functionCall?.args || !this.isRecord(functionCall.args)) {
      throw new BadRequestException(['La IA no devolvió una selección válida de consultores']);
    }
    return functionCall.args;
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
      workModality: 'remote',
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

  private parseServiceRequestJson(value: string, context: string): UnknownRecord {
    const candidates = [value.trim(), ...this.extractJsonObjects(value)].filter(Boolean);
    if (!candidates.length) {
      throw new BadRequestException([`La IA no devolvió un JSON válido para ${context}`]);
    }

    for (const candidate of new Set(candidates)) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (this.isRecord(parsed)) return parsed;
      } catch {
        // Gemini puede envolver el objeto en markdown o texto; se prueban los demás bloques encontrados.
      }
    }

    this.logger.warn(`Gemini devolvió una respuesta no parseable para ${context}`);
    throw new BadRequestException([`La IA devolvió un JSON mal formado para ${context}`]);
  }

  private extractJsonObjects(value: string): string[] {
    const objects: string[] = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === '\\') {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === '{') {
        if (depth === 0) start = index;
        depth += 1;
      } else if (character === '}' && depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          objects.push(value.slice(start, index + 1));
          start = -1;
        }
      }
    }

    return objects;
  }

  private normalizeServiceRequestEvaluation(
    data: UnknownRecord,
    draft: ServiceRequestDraftDto,
  ): ServiceRequestEvaluation {
    const requiredMissing = this.getDraftMissingInformation(draft);
    const reportedMissing = this.readStringArray(data.missingInformation)
      .map((item) => item.replace(/[_-]+/g, ' ').slice(0, 160))
      .filter((item) => !this.isDerivedServiceRequestInformation(item))
      .filter((item) => !this.isMissingInformationAlreadySatisfied(item, draft))
      .slice(0, 12);
    const readyForConfirmation = data.readyForConfirmation === true;
    const userConfirmedReview = data.userConfirmedReview === true;
    const nextFocus = this.readString(data.nextFocus).replace(/[_-]+/g, ' ').slice(0, 160);
    const missingInformation = [...new Set([...requiredMissing, ...reportedMissing])].slice(0, 12);
    if (
      !readyForConfirmation &&
      !missingInformation.length &&
      nextFocus &&
      !this.isMissingInformationAlreadySatisfied(nextFocus, draft)
    ) {
      missingInformation.push(nextFocus);
    }

    // La lista determinista de requisitos evita que una respuesta conservadora o
    // desactualizada del evaluador vuelva a bloquear un draft que ya está completo.
    const isReady = (readyForConfirmation || requiredMissing.length === 0) && missingInformation.length === 0;
    const isComplete = isReady && userConfirmedReview;
    const needsConfirmation = isReady && !userConfirmedReview;

    const phase: ServiceRequestChatResultDto['phase'] = isComplete
      ? 'complete'
      : needsConfirmation
        ? 'confirming'
        : 'gathering';

    return {
      phase,
      isComplete,
      needsConfirmation,
      userConfirmedReview,
      missingInformation: phase === 'gathering' ? missingInformation : [],
      nextFocus: phase === 'gathering' ? nextFocus || missingInformation[0] || '' : '',
    };
  }

  private applyExplicitUserDeliverables(
    draft: ServiceRequestDraftDto,
    conversation: ServiceChatMessage[],
  ): ServiceRequestDraftDto {
    const additions: string[] = [];

    for (const message of conversation) {
      if (message.role !== 'user') continue;
      const normalizedMessage = this.normalizeForComparison(message.content);

      if (/\binforme\b/.test(normalizedMessage) && /\bdigital\b/.test(normalizedMessage)) {
        additions.push('Informe digital');
      }

      if (
        /\binforme\b/.test(normalizedMessage) &&
        /\b(contabilidad|contable|boleta|boletas|factura|facturas|sunat)\b/.test(normalizedMessage)
      ) {
        additions.push('Informe de contabilidad y comprobantes registrados en SUNAT');
      }

      if (
        /\b(factura|facturas|boleta|boletas|comprobante|comprobantes)\b/.test(normalizedMessage) &&
        /\b(boletead|emitid|registrad)\w*/.test(normalizedMessage)
      ) {
        additions.push('Comprobantes boleteados y registrados en SUNAT');
      }
    }

    if (!additions.length) return draft;

    const deliverables = [...draft.deliverables, ...additions]
      .map((item) => this.readLongText(item, 500))
      .filter((item) => item.length >= 3)
      .filter(
        (item, index, items) =>
          items.findIndex(
            (candidate) => this.normalizeForComparison(candidate) === this.normalizeForComparison(item),
          ) === index,
      )
      .slice(0, 20);

    return { ...draft, deliverables };
  }

  private isMissingInformationAlreadySatisfied(value: string, draft: ServiceRequestDraftDto) {
    const normalized = this.normalizeForComparison(value);

    if (
      normalized.includes('entregable') ||
      normalized.includes('resultado que espera recibir') ||
      normalized.includes('informe') ||
      normalized.includes('reporte') ||
      normalized.includes('documento') ||
      normalized.includes('archivo')
    ) {
      return draft.deliverables.length > 0;
    }
    if (normalized.includes('presupuesto')) return this.hasValidDraftBudget(draft);
    if (normalized.includes('fecha limite') || normalized.includes('fecha de entrega')) {
      return this.isCurrentOrFutureDate(draft.deadline);
    }
    if (normalized.includes('duracion')) return draft.estimatedDuration.length >= 2;
    if (normalized.includes('forma de trabajo') || normalized.includes('coordinacion')) {
      return draft.workMethod.length >= 5;
    }
    if (normalized.includes('problema') || normalized.includes('necesidad')) return draft.description.length >= 10;
    if (normalized.includes('resultado esperado') || normalized.includes('meta final')) {
      return draft.expectedOutcome.length >= 10;
    }
    return false;
  }

  private isOffTopicServiceRequestMessage(value: string) {
    const normalized = this.normalizeForComparison(value);
    return /^(eres|son|que)\s+(un\s+)?(idiota|tonto|inutil|estupido|estupida|imbecil)\b/.test(normalized);
  }

  private normalizeForComparison(value: string) {
    return value
      .toLocaleLowerCase('es-PE')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private mergeServiceDraft(
    previousDraft: ServiceRequestDraftDto,
    nextDraft: ServiceRequestDraftDto,
  ): ServiceRequestDraftDto {
    const budgetType = nextDraft.budgetType || previousDraft.budgetType;
    return {
      title: nextDraft.title || previousDraft.title,
      category: nextDraft.category || previousDraft.category,
      subcategory: nextDraft.subcategory || previousDraft.subcategory,
      description: nextDraft.description || previousDraft.description,
      expectedOutcome: nextDraft.expectedOutcome || previousDraft.expectedOutcome,
      requirements: nextDraft.requirements || previousDraft.requirements,
      deliverables: nextDraft.deliverables.length ? nextDraft.deliverables : previousDraft.deliverables,
      exclusions: nextDraft.exclusions || previousDraft.exclusions,
      referenceUrls: nextDraft.referenceUrls.length ? nextDraft.referenceUrls : previousDraft.referenceUrls,
      budgetType,
      budgetMin: nextDraft.budgetMin || previousDraft.budgetMin,
      budgetMax: budgetType === 'range' ? nextDraft.budgetMax || previousDraft.budgetMax : '',
      deadline: nextDraft.deadline || previousDraft.deadline,
      estimatedDuration: nextDraft.estimatedDuration || previousDraft.estimatedDuration,
      workModality: 'remote',
      workMethod: nextDraft.workMethod || previousDraft.workMethod,
      milestones: nextDraft.milestones.length ? nextDraft.milestones : previousDraft.milestones,
      details: nextDraft.details || previousDraft.details,
    };
  }

  private normalizeServiceDraft(value: unknown): ServiceRequestDraftDto {
    const data = this.isRecord(value) ? value : {};
    const category = SERVICE_REQUEST_CATEGORIES.find((item) => item === this.readString(data.category)) ?? '';
    const categoryOption = SERVICE_REQUEST_CATEGORY_OPTIONS.find((item) => item.category === category);
    const requestedSubcategory = this.readString(data.subcategory);
    const subcategory =
      categoryOption?.subcategories.find(
        (item) => item.toLocaleLowerCase('es-PE') === requestedSubcategory.toLocaleLowerCase('es-PE'),
      ) ?? '';
    const budgetType = SERVICE_REQUEST_BUDGET_TYPES.find((item) => item === this.readString(data.budgetType)) ?? '';
    const deadline = this.normalizeDateString(data.deadline);

    return {
      title: this.readString(data.title).slice(0, 160),
      category,
      subcategory,
      description: this.readLongText(data.description, 5000),
      expectedOutcome: this.readLongText(data.expectedOutcome, 5000),
      requirements: this.readLongText(data.requirements, 5000),
      deliverables: this.readStringArray(data.deliverables)
        .map((item) => item.slice(0, 500))
        .filter((item) => item.length >= 3)
        .filter((item, index, items) => items.indexOf(item) === index)
        .slice(0, 20),
      exclusions: this.readLongText(data.exclusions, 5000),
      referenceUrls: this.readStringArray(data.referenceUrls)
        .filter((item) => this.isValidHttpUrl(item))
        .slice(0, 10),
      budgetType,
      budgetMin: this.normalizeMoneyString(data.budgetMin),
      budgetMax: this.normalizeMoneyString(data.budgetMax),
      deadline,
      estimatedDuration: this.readString(data.estimatedDuration).slice(0, 160),
      workModality: 'remote',
      workMethod: this.readLongText(data.workMethod, 5000),
      milestones: this.normalizeServiceMilestones(data.milestones, deadline),
      details: this.readLongText(data.details, 5000),
    };
  }

  private getDraftMissingInformation(draft: ServiceRequestDraftDto) {
    const missing: string[] = [];
    if (draft.description.length < 10) missing.push('problema o necesidad actual');
    if (draft.expectedOutcome.length < 10) missing.push('resultado esperado o meta final');
    if (!draft.deliverables.some((item) => item.length >= 3)) missing.push('entregables específicos');
    if (!this.hasValidDraftBudget(draft)) missing.push('presupuesto estimado');
    if (!this.isCurrentOrFutureDate(draft.deadline)) missing.push('fecha límite de entrega');
    if (draft.estimatedDuration.length < 2) missing.push('duración estimada del servicio');
    if (draft.workMethod.length < 5) missing.push('forma de trabajo y coordinación remota');
    return missing;
  }

  private isDerivedServiceRequestInformation(value: string) {
    const normalized = value
      .toLocaleLowerCase('es-PE')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return ['titulo', 'categoria', 'subcategoria', 'alcance del trabajo'].some((label) => normalized.includes(label));
  }

  private normalizeServiceMilestones(value: unknown, deadline: string): ServiceRequestMilestoneDraftDto[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is UnknownRecord => this.isRecord(item))
      .map((item) => ({
        title: this.readString(item.title).slice(0, 240),
        dueDate: this.normalizeDateString(item.dueDate),
      }))
      .filter(
        (item) =>
          item.title.length >= 3 && this.isCurrentOrFutureDate(item.dueDate) && (!deadline || item.dueDate <= deadline),
      )
      .filter(
        (item, index, items) =>
          items.findIndex((candidate) => candidate.title === item.title && candidate.dueDate === item.dueDate) ===
          index,
      )
      .slice(0, 20);
  }

  private normalizeMoneyString(value: unknown) {
    const raw = (typeof value === 'number' ? String(value) : this.readString(value)).replace(/[^\d.,]/g, '');
    if (!raw) return '';
    let normalized = raw;
    if (raw.includes('.') && raw.includes(',')) {
      const decimalSeparator = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? ',' : '.';
      normalized = decimalSeparator === ',' ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
    } else {
      const separator = raw.includes(',') ? ',' : raw.includes('.') ? '.' : '';
      if (separator) {
        const [integerPart, decimalPart = ''] = raw.split(separator);
        normalized = decimalPart.length === 3 ? `${integerPart}${decimalPart}` : `${integerPart}.${decimalPart}`;
      }
    }
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : '';
  }

  private getServiceRequestDateContext() {
    const timeZone = 'America/Lima';
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') values[part.type] = part.value;
    }

    return {
      today: `${values.year}-${values.month}-${values.day}`,
      formattedDate: new Intl.DateTimeFormat('es-PE', {
        timeZone,
        dateStyle: 'full',
      }).format(now),
      timeZone,
    };
  }

  private normalizeDateString(value: unknown) {
    const date = this.readString(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) return '';
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
      ? date
      : '';
  }

  private isCurrentOrFutureDate(value: string) {
    const normalized = this.normalizeDateString(value);
    if (!normalized) return false;
    return normalized >= this.getServiceRequestDateContext().today;
  }

  private hasValidDraftBudget(draft: ServiceRequestDraftDto) {
    const minimum = Number(draft.budgetMin);
    if (!Number.isFinite(minimum) || minimum <= 0) return false;
    if (draft.budgetType === 'fixed') return true;
    if (draft.budgetType !== 'range') return false;
    const maximum = Number(draft.budgetMax);
    return Number.isFinite(maximum) && maximum >= minimum;
  }

  private isValidHttpUrl(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private toMatchPromptCandidate(candidate: ConsultantMatchCandidate) {
    return {
      consultantId: candidate.id,
      fullName: candidate.fullName,
      headline: candidate.headline,
      bio: candidate.bio?.slice(0, 700) ?? '',
      diagnosticAreas: candidate.diagnosticAreas,
      specialties: candidate.specialties.slice(0, 12),
      services: candidate.services.slice(0, 12),
      sectors: candidate.sectors.slice(0, 10),
      industries: candidate.industries.slice(0, 10),
      companyTypes: candidate.companyTypes.slice(0, 8),
      yearsExperience: candidate.yearsExperience,
      rating: candidate.rating,
      totalReviews: candidate.totalReviews,
      pricePerHour: candidate.pricePerHour,
    };
  }

  private normalizeConsultantMatches(
    data: UnknownRecord,
    candidates: ConsultantMatchCandidate[],
  ): ServiceConsultantMatchesResultDto {
    const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    const matches: ServiceConsultantMatchDto[] = [];
    const usedIds = new Set<number>();
    const rawMatches = Array.isArray(data.matches) ? data.matches : [];

    for (const item of rawMatches) {
      if (!this.isRecord(item)) continue;
      const consultantId = this.readNumber(item.consultantId);
      const candidate = candidateMap.get(consultantId);
      if (!candidate || usedIds.has(consultantId)) continue;
      usedIds.add(consultantId);
      matches.push({
        consultantId,
        fullName: candidate.fullName,
        headline: candidate.headline,
        photoUrl: candidate.photoUrl,
        diagnosticAreas: candidate.diagnosticAreas,
        specialties: candidate.specialties,
        services: candidate.services,
        yearsExperience: candidate.yearsExperience,
        rating: candidate.rating,
        reason:
          this.readLongText(item.reason, 400) ||
          'Su perfil profesional coincide con las necesidades descritas en el servicio.',
      });
      if (matches.length === 3) break;
    }

    if (matches.length !== 3) {
      throw new BadRequestException(['La IA no seleccionó exactamente 3 consultores válidos']);
    }
    return { matches };
  }

  private async validateServiceRequestChat(data: ServiceRequestChatResultDto) {
    const instance = plainToInstance(ServiceRequestChatResultDto, data);
    const errors = await validate(instance, { whitelist: true });
    if (errors.length) {
      throw new BadRequestException(['La IA devolvió una conversación con formato inválido']);
    }
  }

  private async validateConsultantMatches(data: ServiceConsultantMatchesResultDto) {
    const instance = plainToInstance(ServiceConsultantMatchesResultDto, data);
    const errors = await validate(instance, { whitelist: true });
    if (errors.length) {
      throw new BadRequestException(['La IA devolvió consultores con un formato inválido']);
    }
  }

  private assertPyme(currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo una PYME puede usar el asistente de servicios');
    }
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

  private readLongText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, maxLength);
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
