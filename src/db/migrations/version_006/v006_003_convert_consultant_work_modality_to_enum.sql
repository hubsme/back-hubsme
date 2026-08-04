DO $$
BEGIN
  CREATE TYPE "consultant_work_modality" AS ENUM ('remote');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "consultant"
  ALTER COLUMN "work_modality" DROP DEFAULT;

ALTER TABLE "consultant"
  ALTER COLUMN "work_modality" TYPE "consultant_work_modality"
  USING 'remote'::"consultant_work_modality";

ALTER TABLE "consultant"
  ALTER COLUMN "work_modality" SET DEFAULT 'remote'::"consultant_work_modality",
  ALTER COLUMN "work_modality" SET NOT NULL;
