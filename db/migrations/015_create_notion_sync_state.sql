BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE IF NOT EXISTS public.notion_sync_journal (
  target text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (target, key)
);

CREATE TABLE IF NOT EXISTS public.notion_sync_lock (
  target text PRIMARY KEY,
  owner text NOT NULL,
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.notion_sync_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_sync_lock ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notion_sync_journal FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.notion_sync_lock FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notion_sync_journal TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notion_sync_lock TO service_role;

COMMIT;
