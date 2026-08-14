ALTER TABLE "task"
ADD COLUMN IF NOT EXISTS "service_request_id" integer;

DO $$
BEGIN
  ALTER TABLE "task"
  ADD CONSTRAINT "task_service_request_id_service_request_id_fk"
  FOREIGN KEY ("service_request_id")
  REFERENCES "service_request"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "task_service_request_id_unique_idx"
ON "task" USING btree ("service_request_id");
