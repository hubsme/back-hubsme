ALTER TABLE IF EXISTS public.consultant
  ADD COLUMN IF NOT EXISTS owner_phone varchar(30);
