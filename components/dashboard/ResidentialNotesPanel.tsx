'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';

interface ResidentialNotesPanelProps {
  projectId: number;
}

interface NoteItem {
  id: number;
  project_id: number;
  content: string;
  timestamp: string;
  user_id: number;
  author_name?: string | null;
}

const ResidentialNotesPanel: React.FC<ResidentialNotesPanelProps> = ({ projectId }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const { user, role } = useAuth();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/residential-projects/${projectId}/notes`, { method: 'GET', cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleAdd = async () => {
    const content = newNote.trim();
    if (!content) return;
    try {
      setAdding(true);
      setError(null);
      const res = await fetchWithAuth(`/api/residential-projects/${projectId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to add note');
      }
      const created = await res.json();
      setNotes((prev) => [created, ...prev]);
      setNewNote('');
    } catch (e: any) {
      setError(e?.message || 'Failed to add note');
    } finally {
      setAdding(false);
    }
  };

  const canDelete = (n: NoteItem): boolean => {
    if (!user) return false;
    const isOwner = String(n.user_id) === String(user.id);
    const isManager = role === 'manager' || role === 'admin';
    return isOwner || isManager;
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/api/residential-projects/${projectId}/notes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to delete note');
      }
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete note');
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newNote.trim()}
          className="px-3 py-2 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white rounded-md flex items-center"
        >
          <HiPlus className="mr-1" /> Add
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      <div className="overflow-y-auto max-h-[50vh] border border-gray-200 rounded-md">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No notes yet. Be the first to add one.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notes.map((n) => (
              <li key={n.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{n.content}</div>
                  {canDelete(n) && (
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Delete note"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {n.author_name ? <span>{n.author_name}</span> : null}
                  {n.timestamp && (
                    <span className={n.author_name ? 'ml-2' : ''}>{new Date(n.timestamp).toLocaleString()}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ResidentialNotesPanel;
