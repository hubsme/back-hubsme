import { user } from '@db/tables/user.table';
import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

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
    result: jsonb('result')
      .$type<{
        resumenEjecutivo: string;
        puntajeGeneral: number;
        feedbackIa: string;
        areasEvaluadas: { area: string; puntaje: number; estado: string; hallazgo: string }[];
        problemasCriticos: { problema: string; impacto: string; urgencia: string }[];
        recomendaciones: { accion: string; beneficioEsperado: string; plazo: string; prioridad: string }[];
        foda?: {
          fortalezas: string[];
          oportunidades: string[];
          debilidades: string[];
          amenazas: string[];
        };
      }>()
      .notNull(),
    score: integer('score').notNull(),
    summary: text('summary').notNull(),
  },
  (t) => [
    index('diagnostic_pyme_id_idx').on(t.pymeId),
    index('diagnostic_score_idx').on(t.score),
    index('diagnostic_created_at_idx').on(t.createdAt),
  ],
);
