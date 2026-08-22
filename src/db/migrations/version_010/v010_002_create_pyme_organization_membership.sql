DO $$
BEGIN
  CREATE TYPE "pyme_member_role" AS ENUM ('owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "pyme_member_status" AS ENUM ('active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "pyme_invitation_status" AS ENUM ('pending', 'accepted', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "pyme_member" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "joined_at" timestamp DEFAULT now() NOT NULL,
  "pyme_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" "pyme_member_role" DEFAULT 'member' NOT NULL,
  "status" "pyme_member_status" DEFAULT 'active' NOT NULL,
  CONSTRAINT "pyme_member_pyme_fk"
    FOREIGN KEY ("pyme_id") REFERENCES "pyme"("id") ON DELETE CASCADE,
  CONSTRAINT "pyme_member_user_fk"
    FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "pyme_member_pyme_id_idx" ON "pyme_member" ("pyme_id");
CREATE INDEX IF NOT EXISTS "pyme_member_user_id_idx" ON "pyme_member" ("user_id");
CREATE INDEX IF NOT EXISTS "pyme_member_status_idx" ON "pyme_member" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "pyme_member_pyme_user_unique_active_idx"
  ON "pyme_member" ("pyme_id", "user_id")
  WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "pyme_member_user_unique_active_idx"
  ON "pyme_member" ("user_id")
  WHERE "deleted_at" IS NULL AND "status" = 'active';

CREATE TABLE IF NOT EXISTS "pyme_invitation" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "pyme_id" integer NOT NULL,
  "email" varchar(255) NOT NULL,
  "role" "pyme_member_role" DEFAULT 'member' NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "status" "pyme_invitation_status" DEFAULT 'pending' NOT NULL,
  "invited_by_user_id" integer NOT NULL,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  CONSTRAINT "pyme_invitation_pyme_fk"
    FOREIGN KEY ("pyme_id") REFERENCES "pyme"("id") ON DELETE CASCADE,
  CONSTRAINT "pyme_invitation_invited_by_user_fk"
    FOREIGN KEY ("invited_by_user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "pyme_invitation_pyme_id_idx" ON "pyme_invitation" ("pyme_id");
CREATE INDEX IF NOT EXISTS "pyme_invitation_email_idx" ON "pyme_invitation" ("email");
CREATE INDEX IF NOT EXISTS "pyme_invitation_status_idx" ON "pyme_invitation" ("status");
CREATE INDEX IF NOT EXISTS "pyme_invitation_expires_at_idx" ON "pyme_invitation" ("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "pyme_invitation_token_hash_unique_idx"
  ON "pyme_invitation" ("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "pyme_invitation_pyme_email_pending_unique_idx"
  ON "pyme_invitation" ("pyme_id", "email")
  WHERE "deleted_at" IS NULL AND "status" = 'pending';

-- Cada PYME existente queda asociada a su usuario propietario actual.
INSERT INTO "pyme_member" ("pyme_id", "user_id", "role", "status")
SELECT "id", "id", 'owner'::"pyme_member_role", 'active'::"pyme_member_status"
FROM "pyme"
WHERE "deleted_at" IS NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE "pyme_member" IS
  'Usuarios con acceso a una organización PYME. En el MVP cada usuario tiene una sola membresía activa.';
COMMENT ON TABLE "pyme_invitation" IS
  'Invitaciones de acceso a una organización PYME; solo se persiste el hash del token.';
