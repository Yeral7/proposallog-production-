'use client';

import React, { useState, useEffect } from 'react';
import { Project } from './ProposalTable';
import { HiPlus, HiPencil, HiX, HiPhone, HiClipboard, HiMail, HiEye, HiDocumentText } from "react-icons/hi";
import ConfirmationDialog from "../common/ConfirmationDialog";
import CallConfirmationDialog from "../common/CallConfirmationDialog";
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '@/lib/apiClient';
import { logClientAuditAction } from '@/lib/clientAuditLogger';
import { formatDateTimeToCharlotte, formatDateToCharlotte } from '@/lib/timezone';

// Interfaces
interface Contact {
  id: string;
  name: string;
  title: string;
  phone?: string;
  email?: string;
}

interface Drawing {
  id: string;
  title: string;
  url: string;
  date: string;
}

interface Note {
  id: string;
  content: string;
  date: string;
  author: string;
  user_id?: number; 
}

interface ProjectDetailsProps {
  project: Project;
}

const ProjectDetails = ({ project }: ProjectDetailsProps) => {
  const { canEditProjects, user } = useAuth();
  
  // Main State
  const [activeTab, setActiveTab] = useState<'contacts' | 'drawings' | 'notes'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog and Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showDrawingDialog, setShowDrawingDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  // Data State for Forms
  const [currentContact, setCurrentContact] = useState<Partial<Contact>>({ name: '', title: '', phone: '', email: '' });
  const [currentDrawing, setCurrentDrawing] = useState<Partial<Drawing>>({ title: '', url: '' });
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({ content: '' });
  

  // State for actions
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'contacts' | 'drawings' | 'notes' } | null>(null);
  const [phoneToCall, setPhoneToCall] = useState('');
  const [copiedTooltip, setCopiedTooltip] = useState<string | null>(null);

  // Data Persistence Effect
  useEffect(() => {
    if (!project) return;

    setIsLoading(true);
    // Reset state when project changes to prevent data leakage
    setContacts([]);
    setDrawings([]);
    setNotes([]);
    setError('');

    // Fetch contacts from API
    const fetchContacts = async () => {
      try {
        const response = await fetchWithAuth(`/api/projects/${project.id}/contacts`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.map(contact => ({
            id: contact.id.toString(),
            name: contact.name,
            title: contact.title,
            phone: contact.phone,
            email: contact.email
          })));
        } else {
          console.error('Failed to fetch contacts');
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };

    // Fetch notes from API
    const fetchNotes = async () => {
      try {
        const response = await fetchWithAuth(`/api/projects/${project.id}/notes`);
        if (response.ok) {
          const data = await response.json();
          setNotes(data.map((note: any) => ({
            id: note.id.toString(),
            content: note.content, 
            date: note.timestamp || new Date().toISOString(),
            author: note.author,
          })));
        } else {
          console.error('Failed to fetch notes');
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
      }
    };

    // Fetch drawings from API
    const fetchDrawings = async () => {
      try {
        const response = await fetchWithAuth(`/api/projects/${project.id}/drawings`);
        if (response.ok) {
          const data = await response.json();
          setDrawings(data.map(drawing => ({
            id: drawing.id.toString(),
            title: drawing.title,
            url: drawing.url,
            date: drawing.created_at || new Date().toISOString()
          })));
        } else {
          console.error('Failed to fetch drawings');
        }
      } catch (err) {
        console.error('Error fetching drawings:', err);
      }
    };

    // Execute all fetches
    Promise.all([
      fetchContacts(),
      fetchNotes(),
      fetchDrawings()
    ]).catch(err => {
      setError('Failed to load project data.');
      console.error(err);
    }).finally(() => {
      setIsLoading(false);
    });

  }, [project.id]);

  const handleOpenContactDialog = (contact?: Contact) => {
    setIsEditMode(!!contact);
    setCurrentContact(contact || { name: '', title: '', phone: '', email: '' });
    setShowContactDialog(true);
  };

  const handleSaveContact = async () => {
    if (!currentContact.name) {
      setError('Contact name is required.');
      return;
    }
    setError('');

    try {
      let updatedContact;
      if (isEditMode && currentContact.id) {
        // Update existing contact
        const response = await fetchWithAuth(`/api/projects/${project.id}/contacts/${currentContact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentContact),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to update contact');
        }
        updatedContact = await response.json();
        setContacts(contacts.map(c => (c.id === updatedContact.id.toString() ? { ...updatedContact, id: updatedContact.id.toString() } : c)));
        
        // Log audit action
        await logClientAuditAction({
          page: 'Project Details',
          action: `Updated contact: "${currentContact.name}" in project "${project.project_name}"`
        });
      } else {
        // Create new contact
        const response = await fetchWithAuth(`/api/projects/${project.id}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentContact.name,
            title: currentContact.title,
            email: currentContact.email || null,
            phone: currentContact.phone || null,
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to create contact');
        }
        updatedContact = await response.json();
        setContacts([...contacts, { ...updatedContact, id: updatedContact.id.toString() }]);
        
        // Log audit action
        await logClientAuditAction({
          page: 'Project Details',
          action: `Added contact: "${currentContact.name}" to project "${project.project_name}"`
        });
      }
      setShowContactDialog(false);
    } catch (err) {
      console.error('Error saving contact:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleOpenDrawingDialog = (drawing?: Drawing) => {
    setIsEditMode(!!drawing);
    setCurrentDrawing(drawing || { title: '', url: '' });
    setShowDrawingDialog(true);
  };

  const handleSaveDrawing = async () => {
    if (!currentDrawing.title || !currentDrawing.url) {
      alert('Title and URL are required.');
      return;
    }

    const url = `/api/projects/${project.id}/drawings`;
    const method = isEditMode ? 'PUT' : 'POST';

    const body = isEditMode
      ? JSON.stringify({
          id: currentDrawing.id,
          title: currentDrawing.title,
          url: currentDrawing.url
        })
      : JSON.stringify({
          title: currentDrawing.title,
          url: currentDrawing.url
        });

    try {
      const response = await fetchWithAuth(url, {
        method,
        body,
      });

      if (response.ok) {
        const savedDrawing = await response.json();
        const formattedDrawing = {
          id: savedDrawing.id.toString(),
          title: savedDrawing.title,
          url: savedDrawing.url,
          date: savedDrawing.created_at || new Date().toISOString(),
        };

        if (isEditMode) {
          setDrawings(drawings.map(d => d.id === formattedDrawing.id ? formattedDrawing : d));
          
          // Log audit action for edit
          await logClientAuditAction({
            page: 'Project Details',
            action: `Updated drawing: "${formattedDrawing.title}" in project "${project.project_name}"`
          });
        } else {
          setDrawings([...drawings, formattedDrawing]);
          
          // Log audit action for add
          await logClientAuditAction({
            page: 'Project Details',
            action: `Added drawing: "${formattedDrawing.title}" to project "${project.project_name}"`
          });
        }
        setShowDrawingDialog(false);
        setCurrentDrawing({ title: '', url: '' });
        setIsEditMode(false);
      } else {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        console.error('Failed to save drawing:', errorMessage);
        alert(`Failed to save drawing: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Error saving drawing:', err);
      alert('An error occurred while saving the drawing.');
    }
  };

  const handleOpenNoteDialog = (note?: Note) => {
    setIsEditMode(!!note);
    setCurrentNote(note || { content: '' });
    setShowNoteDialog(true);
  };

  const handleSaveNote = async () => {
    if (!currentNote.content?.trim()) {
      setError('Note content cannot be empty.');
      return;
    }
    setError('');

    try {
      const response = await fetchWithAuth(`/api/projects/${project.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          content: currentNote.content,
          user_id: user?.id
        }),
      });

      if (!response.ok) {
        console.error('Note save failed:', response.status, response.statusText);
        let errorMessage = 'Failed to save note';
        try {
          const err = await response.json();
          errorMessage = err.error || errorMessage;
          console.error('API Error Response:', err);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const newNoteFromApi = await response.json();
      
      const newNote: Note = {
        id: newNoteFromApi.id.toString(),
        content: newNoteFromApi.content,
        date: newNoteFromApi.timestamp || new Date().toISOString(),
        author: newNoteFromApi.author,
      };

      if (isEditMode && currentNote.id) {
        setNotes(notes.map(n => (n.id === currentNote.id ? newNote : n)));
        
        await logClientAuditAction({
          page: 'Project Details',
          action: `Updated note in project "${project.project_name}": "${currentNote.content?.substring(0, 100)}${currentNote.content && currentNote.content.length > 100 ? '...' : ''}"`
        });
      } else {
        setNotes([newNote, ...notes]);
        
        await logClientAuditAction({
          page: 'Project Details',
          action: `Added note to project "${project.project_name}": "${currentNote.content?.substring(0, 100)}${currentNote.content && currentNote.content.length > 100 ? '...' : ''}"`
        });
      }

      setShowNoteDialog(false);
      setCurrentNote({ content: '' });

    } catch (err) {
      console.error('Error saving note:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleDeleteClick = (id: string, type: 'contacts' | 'drawings' | 'notes') => {
    setItemToDelete({ id, type });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { id, type } = itemToDelete;
    const url = `/api/projects/${project.id}/${type}`;

    try {
      const response = await fetchWithAuth(url, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        let itemName = '';
        
        if (type === 'contacts') {
          const contact = contacts.find(c => c.id === id);
          itemName = contact?.name || 'Unknown Contact';
          setContacts(contacts.filter(c => c.id !== id));
        } else if (type === 'drawings') {
          const drawing = drawings.find(d => d.id === id);
          itemName = drawing?.title || 'Unknown Drawing';
          setDrawings(drawings.filter(d => d.id !== id));
        } else if (type === 'notes') {
          const note = notes.find(n => n.id === id);
          itemName = note?.content?.substring(0, 50) + (note?.content && note.content.length > 50 ? '...' : '') || 'Unknown Note';
          setNotes(notes.filter(n => n.id !== id));
        }
        
        // Log audit action
        await logClientAuditAction({
          page: 'Project Details',
          action: `Deleted ${type.slice(0, -1)}: "${itemName}" from project "${project.project_name}"`
        });
      } else {
        const errorData = await response.json();
        console.error(`Failed to delete ${type}:`, errorData.error);
        alert(`Failed to delete item: ${errorData.error}`);
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert('An error occurred while deleting the item.');
    }

    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleCopyToClipboard = (text: string, type: 'phone' | 'email') => {
    if (!navigator.clipboard) {
      console.error('Clipboard API not available');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTooltip(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`);
      setTimeout(() => setCopiedTooltip(null), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  // Render Functions
  const renderTabs = () => (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {[{ id: 'contacts', label: 'Contacts' }, { id: 'drawings', label: 'Drawings' }, { id: 'notes', label: 'Notes / History' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-gray-700 text-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const renderContent = () => {
    if (isLoading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    switch (activeTab) {
      case 'contacts': return renderContacts();
      case 'drawings': return renderDrawings();
      case 'notes': return renderNotes();
      default: return null;
    }
  };

  const renderContacts = () => (
    <div>
      <div className="flex justify-end mb-4">
        {canEditProjects() ? (
          <button onClick={() => handleOpenContactDialog()} className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md flex items-center text-sm"><HiPlus className="mr-1" /> Add Contact</button>
        ) : (
          <button disabled className="px-3 py-2 bg-gray-300 text-gray-500 rounded-md flex items-center text-sm cursor-not-allowed" title="View Only - No Add Permission"><HiPlus className="mr-1" /> Add Contact</button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {contacts.length > 0 ? contacts.map(contact => (
          <div key={contact.id} className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg">{contact.name}</h3>
                <div className="flex items-center space-x-0">
                  {canEditProjects() ? (
                    <>
                      <button onClick={() => handleOpenContactDialog(contact)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"><HiPencil size={16} /></button>
                      <button onClick={() => handleDeleteClick(contact.id, 'contacts')} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"><HiX size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button disabled className="p-2 text-gray-300 rounded-full cursor-not-allowed" title="View Only - No Edit Permission"><HiPencil size={16} /></button>
                      <button disabled className="p-2 text-gray-300 rounded-full cursor-not-allowed" title="View Only - No Delete Permission"><HiX size={16} /></button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{contact.title}</p>
              
              {contact.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-700 group mb-1">
                  <HiPhone size={16} className="text-gray-400 flex-shrink-0"/>
                  <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                  <button onClick={() => handleCopyToClipboard(contact.phone!, 'phone')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700">
                    <HiClipboard size={16} />
                  </button>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-700 group">
                  <HiMail size={16} className="text-gray-400 flex-shrink-0"/>
                  <a href={`mailto:${contact.email}`} className="hover:underline truncate" title={contact.email}>{contact.email}</a>
                  <button onClick={() => handleCopyToClipboard(contact.email!, 'email')} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700">
                    <HiClipboard size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )) : (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No contacts found.</p>
            </div>
        )}
      </div>
    </div>
  );

  const renderDrawings = () => (
    <div>
      <div className="flex justify-end mb-4">
        {canEditProjects() ? (
          <button onClick={() => handleOpenDrawingDialog()} className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md flex items-center text-sm"><HiPlus className="mr-1" /> Add Drawing</button>
        ) : (
          <button disabled className="px-3 py-2 bg-gray-300 text-gray-500 rounded-md flex items-center text-sm cursor-not-allowed" title="View Only - No Add Permission"><HiPlus className="mr-1" /> Add Drawing</button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {drawings.length > 0 ? drawings.map(drawing => (
          <div key={drawing.id} className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 flex flex-col justify-between transition hover:shadow-md">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg truncate" title={drawing.title}>{drawing.title}</h3>
                <div className="flex items-center space-x-0">
                  {canEditProjects() ? (
                    <>
                      <button onClick={() => handleOpenDrawingDialog(drawing)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"><HiPencil size={16} /></button>
                      <button onClick={() => handleDeleteClick(drawing.id, 'drawings')} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"><HiX size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button disabled className="p-2 text-gray-300 rounded-full cursor-not-allowed" title="View Only - No Edit Permission"><HiPencil size={16} /></button>
                      <button disabled className="p-2 text-gray-300 rounded-full cursor-not-allowed" title="View Only - No Delete Permission"><HiX size={16} /></button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{formatDateToCharlotte(drawing.date)}</p>
              
              <div className="flex items-center space-x-2 text-sm text-gray-700 group">
                <HiEye size={16} className="text-gray-400 flex-shrink-0"/>
                <a href={drawing.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" title={drawing.url}>View Drawing</a>
              </div>
            </div>
          </div>
        )) : (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No drawings found.</p>
            </div>
        )}
      </div>
    </div>
  );

  const renderNotes = () => (
    <div>
      <div className="flex justify-end mb-4">
        {canEditProjects() ? (
          <button onClick={() => handleOpenNoteDialog()} className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md flex items-center text-sm"><HiPlus className="mr-1" /> Add Note</button>
        ) : (
          <button disabled className="px-3 py-2 bg-gray-300 text-gray-500 rounded-md flex items-center text-sm cursor-not-allowed" title="View Only - No Add Permission"><HiPlus className="mr-1" /> Add Note</button>
        )}
      </div>
      {notes.length > 0 ? (
        <div className="flow-root">
          <ul className="-mb-8">
            {notes.map((note, noteIdx) => (
              <li key={note.id}>
                <div className="relative pb-8">
                  {noteIdx !== notes.length - 1 ? (
                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-white ring-8 ring-white">
                        <HiDocumentText className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{note.author}</span>
                        {' posted on '}
                        <time dateTime={note.date}>{formatDateTimeToCharlotte(note.date)}</time>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                     <div className="flex-shrink-0 self-center">
                        {canEditProjects() ? (
                          <>
                            <button onClick={() => handleOpenNoteDialog(note)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"><HiPencil size={16} /></button>
                            <button onClick={() => handleDeleteClick(note.id, 'notes')} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"><HiX size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button disabled className="p-2 text-gray-300 rounded-full cursor-not-allowed" title="View Only - No Edit Permission"><HiPencil size={16} /></button>
                            <button disabled className="p-2 text-gray-300 rounded-full cursor-not-allowed" title="View Only - No Delete Permission"><HiX size={16} /></button>
                          </>
                        )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No notes yet. Be the first to add one!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-full px-8 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Project Details</h2>
      </div>

      {renderTabs()}

      <div className="py-6">
        {renderContent()}
      </div>

      {/* Contact Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{isEditMode ? 'Edit Contact' : 'Add Contact'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Name" value={currentContact.name || ''} onChange={(e) => setCurrentContact({ ...currentContact, name: e.target.value })} className="border p-2 w-full rounded-md" />
              <input type="text" placeholder="Title" value={currentContact.title || ''} onChange={(e) => setCurrentContact({ ...currentContact, title: e.target.value })} className="border p-2 w-full rounded-md" />
              <input type="text" placeholder="Phone" value={currentContact.phone || ''} onChange={(e) => setCurrentContact({ ...currentContact, phone: e.target.value })} className="border p-2 w-full rounded-md" />
              <input type="email" placeholder="Email" value={currentContact.email || ''} onChange={(e) => setCurrentContact({ ...currentContact, email: e.target.value })} className="border p-2 w-full rounded-md" />
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button onClick={() => setShowContactDialog(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleSaveContact} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Dialog */}
      {showDrawingDialog && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{isEditMode ? 'Edit Drawing' : 'Add Drawing'}</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Title" value={currentDrawing.title} onChange={(e) => setCurrentDrawing({ ...currentDrawing, title: e.target.value })} className="border p-2 w-full rounded-md" />
              <input type="text" placeholder="URL" value={currentDrawing.url} onChange={(e) => setCurrentDrawing({ ...currentDrawing, url: e.target.value })} className="border p-2 w-full rounded-md" />
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button onClick={() => setShowDrawingDialog(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleSaveDrawing} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">{isEditMode ? 'Edit Note' : 'Add Note'}</h3>
            <div className="relative">
              <textarea 
                placeholder="Write your note here..."
                value={currentNote.content || ''}
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                className="border p-3 w-full rounded-md focus:ring-2 focus:ring-gray-500 focus:outline-none transition-shadow duration-200"
                rows={8}
                maxLength={1000}
              ></textarea>
              <div className="text-right text-sm text-gray-500 mt-1">
                {currentNote.content?.length || 0} / 1000
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button onClick={() => setShowNoteDialog(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
              <button onClick={handleSaveNote} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title={`Delete ${itemToDelete?.type.slice(0, -1)}`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Phone Confirmation Dialog */}
      <CallConfirmationDialog 
        isOpen={showPhoneDialog}
        phoneNumber={phoneToCall}
        onConfirm={() => { /* Implement calling logic */ setShowPhoneDialog(false); }}
        onCancel={() => setShowPhoneDialog(false)}
      />

      {/* Copied to Clipboard Tooltip */}
      {copiedTooltip && (
          <div className="fixed bottom-10 right-10 bg-gray-900 text-white text-sm py-2 px-4 rounded-lg shadow-lg z-50">
              {copiedTooltip}
          </div>
      )}
    </div>
  );
};

export default ProjectDetails;
