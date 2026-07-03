CREATE TABLE IF NOT EXISTS "subscription_plans" (
  "id" text PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "name" text NOT NULL,
  "price" integer NOT NULL,
  "description" text NOT NULL,
  "features" text[] DEFAULT '{}'::text[] NOT NULL
);

-- Seed initial values if not exists
INSERT INTO "subscription_plans" ("id", "name", "price", "description", "features") VALUES
  ('free', 'Gratuito', 0, 'Para explorar la plataforma con herramientas básicas.', ARRAY['Clientes ilimitados', '5 llamados de IA al mes', 'Modelos de IA estándar (Gemini Flash)']),
  ('basic', 'Básico', 29, 'Para consultores con flujo inicial de trabajo.', ARRAY['Clientes ilimitados', '30 llamados de IA al mes', 'Modelos de IA estándar (Gemini Flash)']),
  ('pro', 'Profesional', 49, 'Para consultores con cartera activa y alta demanda.', ARRAY['Clientes ilimitados', 'Llamados de IA ilimitados', 'Modelos de IA avanzados (Gemini Pro)', 'Generación de cupones de descuento para PYMEs']),
  ('expert', 'Experto', 79, 'Para agencias y consultores senior con necesidades avanzadas.', ARRAY['Clientes ilimitados', 'Llamados de IA ilimitados (prioritarios)', 'Modelos de IA avanzados (Gemini Pro / Ultra)', 'Generación de cupones de descuento ilimitados', 'Soporte prioritario y estratégico'])
ON CONFLICT ("id") DO NOTHING;

-- Alter subscription table to use a foreign key instead of enum
ALTER TABLE "subscription" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscription" ALTER COLUMN "plan" TYPE text USING "plan"::text;
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_fk" FOREIGN KEY ("plan") REFERENCES "subscription_plans"("id");
ALTER TABLE "subscription" ALTER COLUMN "plan" SET DEFAULT 'free';

-- Alter consultant table to add cv_url column
ALTER TABLE "consultant" ADD COLUMN IF NOT EXISTS "cv_url" text;
