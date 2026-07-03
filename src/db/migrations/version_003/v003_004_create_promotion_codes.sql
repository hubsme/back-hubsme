CREATE TABLE IF NOT EXISTS "promotion_code" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "code" varchar(40) NOT NULL,
  "description" varchar(255),
  "max_redemptions" integer DEFAULT 1 NOT NULL,
  "redemption_count" integer DEFAULT 0 NOT NULL,
  "starts_at" timestamp,
  "expires_at" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "promotion_code_max_redemptions_positive" CHECK ("max_redemptions" > 0),
  CONSTRAINT "promotion_code_redemption_count_non_negative" CHECK ("redemption_count" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "promotion_code_code_unique_active_idx"
  ON "promotion_code" ("code")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "promotion_code_active_idx"
  ON "promotion_code" ("is_active");

CREATE INDEX IF NOT EXISTS "promotion_code_expires_at_idx"
  ON "promotion_code" ("expires_at");

CREATE TABLE IF NOT EXISTS "promotion_code_redemption" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "promotion_code_id" integer NOT NULL REFERENCES "promotion_code"("id"),
  "checkout_id" integer NOT NULL REFERENCES "mercado_pago_payment"("id"),
  "pyme_id" integer NOT NULL REFERENCES "app_user"("id"),
  "consultant_id" integer NOT NULL REFERENCES "app_user"("id"),
  "meeting_id" integer REFERENCES "meeting"("id"),
  "redeemed_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "promotion_code_redemption_checkout_unique_active_idx"
  ON "promotion_code_redemption" ("checkout_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "promotion_code_redemption_code_idx"
  ON "promotion_code_redemption" ("promotion_code_id");

CREATE INDEX IF NOT EXISTS "promotion_code_redemption_pyme_idx"
  ON "promotion_code_redemption" ("pyme_id");
