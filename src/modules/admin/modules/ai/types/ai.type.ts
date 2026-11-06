import type { ServiceRequestChatResultDto } from '@modules/admin/modules/ai/dto/run-service-request-chat.dto';
import type { ConsultantQuery } from '@queries/consultant/consultant.query';

export type UnknownRecord = Record<string, unknown>;

export type RunPromptOptions = {
  useGoogleSearch?: boolean;
  temperature?: number;
  responseJsonSchema?: UnknownRecord;
};

export type InteractionResponseShape = {
  steps?: Array<
    | string
    | {
        model_turn?: { parts?: Array<{ text?: string }> };
        text?: string;
      }
  >;
  outputs?: Array<{ type?: string; text?: string }>;
  text?: string;
  output_text?: string;
  usage?: {
    total_input_tokens?: number;
    total_output_tokens?: number;
    total_tokens?: number;
  };
};

export type ServiceChatMessage = { role: 'assistant' | 'user'; content: string };

export type ServiceRequestMeetingContext = {
  id: number;
  title: string;
  minutes: string;
  sourceTask: {
    id: number;
    title: string;
    description: string;
    assignedTo: 'pyme' | 'consultor';
    status: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
    dueDate: string | null;
  } | null;
  tasks: Array<{
    title: string;
    description: string;
    assignedTo: 'pyme' | 'consultor';
    status: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
    dueDate: string | null;
  }>;
};

export type ServiceRequestEvaluation = {
  phase: ServiceRequestChatResultDto['phase'];
  isComplete: boolean;
  needsConfirmation: boolean;
  userConfirmedReview: boolean;
  missingInformation: string[];
  nextFocus: string;
};

export type ConsultantMatchCandidate = Awaited<ReturnType<ConsultantQuery['findAvailableForAiMatching']>>[number];
