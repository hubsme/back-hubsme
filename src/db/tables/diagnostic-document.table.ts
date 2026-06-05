import { pgTable, serial, text, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { diagnostic } from './diagnostic.table';
import { user } from './user.table';

export const diagnosticDocumentTypeEnum = pgEnum('diagnostic_document_type', [
  'informe',
  'plan_accion',
  'respuestas',
]);

export const diagnosticDocument = pgTable(
  'diagnostic_document',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    diagnosticId: integer('diagnostic_id')
      .notNull()
      .references(() => diagnostic.id, { onDelete: 'cascade' }),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    title: text('title').notNull(),
    type: diagnosticDocumentTypeEnum('type').notNull(),
    content: text('content').notNull(),
  },
  (t) => [
    index('diagnostic_document_diagnostic_id_idx').on(t.diagnosticId),
    index('diagnostic_document_pyme_id_idx').on(t.pymeId),
    index('diagnostic_document_type_idx').on(t.type),
    index('diagnostic_document_created_at_idx').on(t.createdAt),
  ],
);

export type DiagnosticDocument = typeof diagnosticDocument.$inferSelect;
export type DiagnosticDocumentDTO = typeof diagnosticDocument.$inferInsert;
