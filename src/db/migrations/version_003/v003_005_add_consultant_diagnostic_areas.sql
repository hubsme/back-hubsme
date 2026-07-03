DO $$
BEGIN
  CREATE TYPE "consultant_diagnostic_area" AS ENUM (
    'Estratégica',
    'Financiera',
    'Comercial / Ventas',
    'Marketing',
    'Servicio al cliente',
    'Operaciones',
    'Organizacional / RRHH',
    'Tecnología',
    'Legal',
    'Laboral',
    'Tributario / Contable'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "consultant"
  ADD COLUMN IF NOT EXISTS "diagnostic_areas" "consultant_diagnostic_area"[]
  DEFAULT ARRAY[]::"consultant_diagnostic_area"[]
  NOT NULL;

CREATE INDEX IF NOT EXISTS "consultant_diagnostic_areas_idx"
  ON "consultant"
  USING gin ("diagnostic_areas");
