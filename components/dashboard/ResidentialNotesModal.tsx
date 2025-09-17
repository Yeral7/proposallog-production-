'use client';

import React, { useEffect, useState } from 'react';
import { HiX, HiPlus } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';

interface ResidentialNotesModalProps {
  projectId: number | null;
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NoteItem {
  id: number;
  project_id: number;
  content: string;
  timestamp: string;
  user_id: number;
  author_name: string | null;
}

const ResidentialNotesModal: React.FC<ResidentialNotesModalProps> = ({ projectId, projectName, isOpen, onClose }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;
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
    load();
  }, [isOpen, projectId]);

  const handleAdd = async () => {
    const content = newNote.trim();
    if (!projectId || !content) return;
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

  if (!isOpen || !projectId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-[var(--header-gray)] text-white p-4 rounded-t shadow-sm -mt-6 -mx-6">
            <h2 className="text-xl font-bold">Notes{projectName ? ` - ${projectName}` : ''}</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200" aria-label="Close">
              <HiX className="w-6 h-6" />
            </button>
          </div>

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

          <div className="overflow-y-auto max-h-[55vh] border border-gray-200 rounded-md">
            {loading ? (
              <div className="p-6 text-sm text-gray-600">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No notes yet. Be the first to add one.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notes.map((n) => (
                  <li key={n.id} className="p-4">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{n.content}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      <span>{n.author_name || ''}</span>
                      {n.timestamp && (
                        <span className="ml-2">{new Date(n.timestamp).toLocaleString()}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentialNotesModal;
