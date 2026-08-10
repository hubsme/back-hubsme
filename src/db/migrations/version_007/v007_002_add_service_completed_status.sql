ALTER TYPE "service_request_status"
  ADD VALUE IF NOT EXISTS 'completed' AFTER 'paid';
