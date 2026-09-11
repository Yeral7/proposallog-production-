BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE public.notion_project_links (
  notion_database_id uuid NOT NULL,
  notion_data_source_id uuid NOT NULL,
  estimated_database_id uuid NOT NULL,
  estimated_data_source_id uuid NOT NULL,
  project_group_id bigint NOT NULL CHECK (project_group_id > 0),
  source_project_id bigint REFERENCES public.projects(id) ON DELETE SET NULL,
  notion_page_id uuid NOT NULL,
  estimated_page_id uuid,
  baseline jsonb CHECK (baseline IS NULL OR jsonb_typeof(baseline) = 'object'),
  source_contact_id bigint,
  source_contact_table text CHECK (source_contact_table IN ('project_contacts', 'builder_contacts')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notion_data_source_id, estimated_data_source_id, project_group_id),
  UNIQUE (notion_data_source_id, notion_page_id),
  UNIQUE (notion_data_source_id, estimated_data_source_id, estimated_page_id)
);

ALTER TABLE public.notion_project_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notion_project_links FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notion_project_links TO service_role;

CREATE FUNCTION public.apply_notion_project_sync(p_request jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_page uuid := (p_request->>'notion_page_id')::uuid;
  v_estimated uuid := (p_request->>'estimated_page_id')::uuid;
  v_source bigint := (p_request->>'source_project_id')::bigint;
  v_group bigint := (p_request->>'project_group_id')::bigint;
  v_changes jsonb := p_request->'changes';
  v_expected jsonb := p_request->'expected';
  v_baseline jsonb := p_request->'baseline';
  v_link public.notion_project_links%ROWTYPE;
  v_current public.projects%ROWTYPE;
  v_next public.projects%ROWTYPE;
  v_linked boolean;
  v_created boolean := false;
  v_latest bigint;
  v_fields text[] := ARRAY['project_name', 'builder_id', 'estimator_id', 'status_id', 'location_id', 'due_date', 'estimation_due_date', 'submission_date', 'follow_up_date', 'contract_value', 'priority_id', 'lost_reason'];
BEGIN
  IF v_page IS NULL OR jsonb_typeof(v_changes) IS DISTINCT FROM 'object' OR jsonb_typeof(v_baseline) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid Notion sync request';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(v_changes) AS k(key) WHERE NOT (key = ANY(v_fields))) THEN
    RAISE EXCEPTION 'Unsupported project field';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('notion-project:' || v_page::text, 0));
  SELECT * INTO v_link FROM public.notion_project_links
    WHERE notion_data_source_id = '05c75b2d-077e-8376-8c36-077107bed9ad' AND notion_page_id = v_page FOR UPDATE;
  v_linked := FOUND;
  IF v_source IS NULL THEN
    IF v_linked THEN
      IF v_link.source_project_id IS NULL THEN RAISE EXCEPTION 'Linked project was removed; do not recreate'; END IF;
      RETURN jsonb_build_object('action', 'already_linked', 'project_id', v_link.source_project_id, 'project_group_id', v_link.project_group_id);
    END IF;
    IF v_group IS NOT NULL THEN RAISE EXCEPTION 'New projects cannot select a group'; END IF;
    v_created := true;
  ELSE
    IF v_source <= 0 OR v_group IS NULL OR v_group <= 0 THEN RAISE EXCEPTION 'Invalid project identity'; END IF;
    IF v_linked AND (v_link.source_project_id IS DISTINCT FROM v_source OR v_link.project_group_id <> v_group) THEN
      RAISE EXCEPTION 'Linked source changed; review before syncing';
    END IF;
    PERFORM 1 FROM public.projects WHERE id = v_group AND reference_project_id IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Project group changed'; END IF;
    SELECT * INTO v_current FROM public.projects WHERE id = v_source FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Project was removed; do not recreate'; END IF;
    WITH RECURSIVE members AS (
      SELECT id, ARRAY[id] AS visited FROM public.projects WHERE id = v_group
      UNION ALL
      SELECT p.id, m.visited || p.id FROM public.projects p JOIN members m ON p.reference_project_id = m.id WHERE NOT p.id = ANY(m.visited)
    ) SELECT max(id) INTO v_latest FROM members;
    IF v_latest IS DISTINCT FROM v_source THEN RAISE EXCEPTION 'Latest GC source changed'; END IF;
    IF jsonb_typeof(v_expected) IS DISTINCT FROM 'object' OR NOT (v_expected ?& (v_fields || ARRAY['reference_project_id'])) OR NOT (to_jsonb(v_current) @> v_expected) THEN
      RAISE EXCEPTION 'Project changed after preview; refresh before syncing';
    END IF;
  END IF;
  SELECT * INTO v_next FROM jsonb_populate_record(v_current, v_changes);
  IF v_next.project_name IS NULL OR length(trim(v_next.project_name)) = 0 OR length(v_next.project_name) > 2000 OR v_next.builder_id IS NULL OR v_next.estimator_id IS NULL OR v_next.status_id IS NULL THEN
    RAISE EXCEPTION 'Project name, builder, estimator and status are required';
  END IF;
  IF v_created THEN
    INSERT INTO public.projects (project_name, builder_id, estimator_id, status_id, location_id, due_date, estimation_due_date, submission_date, follow_up_date, contract_value, priority_id, lost_reason)
    VALUES (v_next.project_name, v_next.builder_id, v_next.estimator_id, v_next.status_id, v_next.location_id, v_next.due_date, v_next.estimation_due_date, v_next.submission_date, v_next.follow_up_date, v_next.contract_value, v_next.priority_id, v_next.lost_reason)
    RETURNING * INTO v_current;
    v_source := v_current.id;
    v_group := v_current.id;
  ELSIF v_changes <> '{}'::jsonb THEN
    UPDATE public.projects SET project_name = v_next.project_name, builder_id = v_next.builder_id, estimator_id = v_next.estimator_id, status_id = v_next.status_id, location_id = v_next.location_id, due_date = v_next.due_date, estimation_due_date = v_next.estimation_due_date, submission_date = v_next.submission_date, follow_up_date = v_next.follow_up_date, contract_value = v_next.contract_value, priority_id = v_next.priority_id, lost_reason = v_next.lost_reason
    WHERE id = v_source;
  END IF;
  IF v_linked THEN
    UPDATE public.notion_project_links SET baseline = v_baseline, estimated_page_id = v_estimated, last_synced_at = now(), updated_at = now()
    WHERE notion_data_source_id = '05c75b2d-077e-8376-8c36-077107bed9ad' AND notion_page_id = v_page;
  ELSE
    INSERT INTO public.notion_project_links (notion_database_id, notion_data_source_id, estimated_database_id, estimated_data_source_id, project_group_id, source_project_id, notion_page_id, estimated_page_id, baseline, last_synced_at)
    VALUES ('8c275b2d-077e-83ae-9c64-01d4877c73f0', '05c75b2d-077e-8376-8c36-077107bed9ad', '3d775b2d-077e-8060-8206-e8fc185a1452', '3d775b2d-077e-80c0-9867-000b7f107c82', v_group, v_source, v_page, v_estimated, v_baseline, now());
  END IF;
  IF v_created OR v_changes <> '{}'::jsonb THEN
    INSERT INTO public.audit_log (username, email, page, action)
    VALUES ('Notion Sync', 'notion-sync@internal.invalid', 'Proposal Log', jsonb_build_object('source', 'notion', 'project_id', v_source, 'notion_page_id', v_page, 'created', v_created, 'changes', v_changes)::text);
  END IF;
  RETURN jsonb_build_object('action', CASE WHEN v_created THEN 'created' WHEN v_changes <> '{}'::jsonb THEN 'updated' ELSE 'linked' END, 'project_id', v_source, 'project_group_id', v_group);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_notion_project_sync(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_notion_project_sync(jsonb) TO service_role;

COMMIT;
