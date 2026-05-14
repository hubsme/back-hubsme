DO $$
BEGIN
  CREATE TYPE pyme_consultant_match_status AS ENUM ('activo', 'pausado', 'finalizado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS pyme_consultant_match (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,
  pyme_id INTEGER NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  consultant_id INTEGER NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  status pyme_consultant_match_status NOT NULL DEFAULT 'activo',
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS pyme_consultant_match_pyme_id_idx
  ON pyme_consultant_match (pyme_id);

CREATE INDEX IF NOT EXISTS pyme_consultant_match_consultant_id_idx
  ON pyme_consultant_match (consultant_id);

CREATE INDEX IF NOT EXISTS pyme_consultant_match_status_idx
  ON pyme_consultant_match (status);

CREATE UNIQUE INDEX IF NOT EXISTS pyme_consultant_match_pair_unique_active_idx
  ON pyme_consultant_match (pyme_id, consultant_id)
  WHERE deleted_at IS NULL;
