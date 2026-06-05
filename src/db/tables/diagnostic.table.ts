import { pgTable, serial, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { user } from './user.table';

export type DiagnosticResult = {
  resumenEjecutivo: string;
  puntajeGeneral: number;
  feedbackIa: string;
  areasEvaluadas: { area: string; puntaje: number; estado: string; hallazgo: string }[];
  problemasCriticos: { problema: string; impacto: string; urgencia: string }[];
  recomendaciones: { accion: string; beneficioEsperado: string; plazo: string; prioridad: string }[];
  proximosPasos: string[];
};

export const diagnostic = pgTable(
  'diagnostic',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    responses: jsonb('responses').$type<Record<string, unknown>>().default({}).notNull(),
    result: jsonb('result').$type<DiagnosticResult>().notNull(),
    score: integer('score').notNull(),
    summary: text('summary').notNull(),
  },
  (t) => [
    index('diagnostic_pyme_id_idx').on(t.pymeId),
    index('diagnostic_score_idx').on(t.score),
    index('diagnostic_created_at_idx').on(t.createdAt),
  ],
);

export type Diagnostic = typeof diagnostic.$inferSelect;
export type DiagnosticDTO = typeof diagnostic.$inferInsert;
