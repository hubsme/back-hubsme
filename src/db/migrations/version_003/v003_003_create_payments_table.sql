CREATE TABLE IF NOT EXISTS "payments" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "user_id" integer NOT NULL REFERENCES "app_user"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "reference_id" text,
  "preference_id" varchar(180),
  "init_point" text,
  "sandbox_init_point" text,
  "external_reference" varchar(180) NOT NULL,
  "mercado_pago_payment_id" varchar(180),
  "status" varchar(50) DEFAULT 'created' NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "currency" varchar(10) DEFAULT 'PEN' NOT NULL,
  "raw_payment" jsonb
);

CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX IF NOT EXISTS "payments_external_ref_idx" ON "payments"("external_reference");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
