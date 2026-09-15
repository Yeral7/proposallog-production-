'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';

interface SyncStatus {
  writesEnabled: boolean;
  supabaseWritesEnabled?: boolean;
  previewEnabled: boolean;
  tokenConfigured: boolean;
}

interface ProposalRow {
  projectId: number | null;
  notionPageId?: string;
  builder?: string | null;
  fields?: string[];
  conflicts?: string[];
  sourceProjectId: number;
  memberIds?: number[];
  values?: Record<string, string | number | null>;
  action?: string;
  error?: string;
  [key: string]: unknown;
}

interface Preview {
  sourceProjectCount?: number;
  groupedProjectCount?: number;
  issues?: string[];
  setupIssues?: string[];
  nextAfterProjectId?: number | null;
  results?: ProposalRow[];
  proposals?: ProposalRow[];
  changes?: { dataSourceId: string; properties: string[] }[];
  dryRun?: boolean;
}

type Scope = 'source' | 'compare' | 'setup' | 'publish' | 'inbound';

export default function NotionSyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [lastScope, setLastScope] = useState<Scope | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [projectId, setProjectId] = useState('');
  const [afterProjectId, setAfterProjectId] = useState(0);

  useEffect(() => {
    let active = true;
    fetchWithAuth('/api/sync/notion').then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not read sync configuration');
      if (active) setStatus(data);
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);

  const run = async (scope: Scope, dryRun = true, cursor = afterProjectId) => {
    if (!dryRun && !window.confirm(scope === 'setup'
      ? 'Add the missing sync properties to the two development Notion databases? Supabase will not be changed.'
      : scope === 'inbound'
        ? 'Pull up to 10 changed or new rows from development Notion into Supabase? Projects and lookups may be created or updated.'
        : `Publish ${projectId ? `the group containing project #${projectId}` : `up to 5 groups after #${cursor}`} to development Notion? Supabase will not be changed.`)) return;
    setBusy(true);
    setError('');
    setPreview(null);
    setLastScope(scope);
    if (scope === 'publish') setAfterProjectId(cursor);
    try {
      const response = await fetchWithAuth('/api/sync/notion', {
        method: 'POST',
        body: JSON.stringify({ scope, dryRun, limit: scope === 'publish' ? 5 : scope === 'inbound' ? 10 : 20, ...(scope !== 'setup' && scope !== 'inbound' && projectId ? { projectId: Number(projectId) } : {}), ...(scope === 'publish' ? { afterProjectId: cursor } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Notion request failed');
      setPreview(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Notion request failed');
    } finally {
      setBusy(false);
    }
  };

  const notionReady = status?.previewEnabled && status?.tokenConfigured;
  const issues = [...(preview?.issues || []), ...(preview?.setupIssues || [])];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800">Notion Sync Publisher</h2>
      <p className="text-sm text-gray-600 mt-2">Supabase stays read-only. Only explicit live actions create or update Notion pages; nothing is deleted. This panel has no built-in scheduler. An outbound CLI watcher can run separately; inbound synchronization is not active yet.</p>
      <p className="text-sm text-gray-600 mt-2">Linked GC records share a root project ID. The latest app row and contact supply the published fields, with status twins and builder names in OG GC / Client. Notion owns Follow-up1; outbound publishing never overwrites it. Other conflicting Notion edits require review.</p>
      {status && !notionReady && (
        <div className="mt-4 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          App data preview is available. Notion access requires NOTION_TOKEN and a preview or publish flag in the server environment. Do not paste tokens here.
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3 mt-4">
        <div>
          <label htmlFor="notion-preview-project" className="block text-sm font-medium text-gray-700 mb-1">App project ID (optional)</label>
          <input id="notion-preview-project" type="number" min="1" step="1" disabled={busy} value={projectId} onChange={event => { setProjectId(event.target.value); setAfterProjectId(0); setPreview(null); }} className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="First groups" />
        </div>
        <button onClick={() => run('source')} disabled={busy || !status} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md text-sm disabled:opacity-50">{busy ? 'Working...' : 'Preview App Data'}</button>
        <button onClick={() => run('compare')} disabled={busy || !notionReady} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">Compare with Notion</button>
      </div>
      <div className="flex flex-wrap items-end gap-3 mt-3">
        <button onClick={() => run('setup')} disabled={busy || !notionReady} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">Dry-run Setup</button>
        <button onClick={() => run('publish')} disabled={busy || !notionReady} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">Dry-run Publish</button>
        <button onClick={() => run('inbound')} disabled={busy || !notionReady} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">Dry-run Pull</button>
        {status?.writesEnabled && <>
          <button onClick={() => run('setup', false)} disabled={busy || !notionReady} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">Apply Notion Setup</button>
          <button onClick={() => run('publish', false)} disabled={busy || !notionReady} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md text-sm disabled:opacity-50">Publish to Notion</button>
        </>}
        {status?.writesEnabled && status?.supabaseWritesEnabled && (
          <button onClick={() => run('inbound', false)} disabled={busy || !notionReady} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md text-sm disabled:opacity-50">Pull from Notion</button>
        )}
      </div>
      <p className="mt-3 text-sm text-gray-600">Publish batches contain up to 5 groups, starting after #{afterProjectId}. {afterProjectId > 0 && <button disabled={busy} onClick={() => { setAfterProjectId(0); setPreview(null); }} className="underline">Reset to first batch</button>}</p>
      {status && !status.writesEnabled && <p className="mt-3 text-sm text-gray-600">Live web publishing is disabled. Enable NOTION_SYNC_PUBLISH_ENABLED only on a single publisher host with persistent NOTION_SYNC_STATE_DIR storage.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {preview && (
        <div className="mt-6">
          {preview.sourceProjectCount !== undefined && <p className="text-sm text-gray-600">{preview.sourceProjectCount} app records / {preview.groupedProjectCount} linked project groups.</p>}
          {preview.dryRun !== undefined && <p className="text-sm text-gray-600">{preview.dryRun ? 'Dry run — no changes made.' : 'Live action completed. Check blocked rows below.'}</p>}
          {issues.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-yellow-800">{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
          {preview.changes && <div className="mt-3 text-sm text-gray-700">
            <p className="font-medium">Notion setup properties:</p>
            {preview.changes.map(change => <p key={change.dataSourceId}>{change.dataSourceId}: {change.properties.join(', ') || 'no changes needed'}</p>)}
          </div>}
          {lastScope === 'inbound' && preview.results && (
            <table className="mt-3 w-full text-sm text-gray-700 border border-gray-200">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">Action</th><th className="px-3 py-2">Project</th><th className="px-3 py-2">Notion page</th><th className="px-3 py-2">Builder</th><th className="px-3 py-2">Fields / conflicts</th><th className="px-3 py-2">Error</th>
              </tr></thead>
              <tbody>{preview.results.map((row, index) => (
                <tr key={row.notionPageId ?? row.projectId ?? index} className="border-t border-gray-200">
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2">{row.projectId ?? ''}</td>
                  <td className="px-3 py-2">{row.notionPageId ?? ''}</td>
                  <td className="px-3 py-2">{row.builder ?? ''}</td>
                  <td className="px-3 py-2">{[...(row.fields || []), ...(row.conflicts || []).map(field => `conflict: ${field}`)].join(', ')}</td>
                  <td className="px-3 py-2 text-red-700">{row.error ?? ''}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {lastScope !== 'inbound' && (preview.results || preview.proposals || []).map((proposal, index) => (
            <details key={proposal.projectId ?? proposal.notionPageId ?? index} className="mt-3 border border-gray-200 rounded-md p-3">
              <summary className="cursor-pointer text-sm text-gray-800">
                #{proposal.projectId}{proposal.values ? ` — ${proposal.values.project_name} — ${proposal.values.builder_name || 'No GC'}` : ''} — latest row #{proposal.sourceProjectId}{proposal.action ? ` — ${proposal.action}` : ''}
              </summary>
              {proposal.error && <p className="mt-2 text-xs text-red-700">{proposal.error}</p>}
              <pre className="mt-3 p-3 bg-gray-50 rounded-md overflow-auto max-h-96 text-xs">{JSON.stringify(proposal, null, 2)}</pre>
            </details>
          ))}
          {preview.results && preview.nextAfterProjectId != null && <button disabled={busy || !notionReady} onClick={() => run('publish', true, preview.nextAfterProjectId!)} className="mt-3 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 disabled:opacity-50">Preview Next Publish Batch</button>}
        </div>
      )}
    </div>
  );
}
