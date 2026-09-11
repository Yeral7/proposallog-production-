BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

ALTER TABLE public.projects ADD COLUMN estimation_due_date date;

COMMIT;
