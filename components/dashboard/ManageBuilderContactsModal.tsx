"use client";

import React, { useEffect, useState } from "react";
import { HiPlus, HiPencil, HiTrash, HiX, HiCheck } from "react-icons/hi";
import { fetchWithAuth } from "@/lib/apiClient";
import ConfirmDeleteModal from "../common/ConfirmDeleteModal";

interface ManageBuilderContactsModalProps {
  isVisible: boolean;
  onClose: () => void;
  builderId: number | null;
  builderName?: string;
}

interface BuilderContact {
  id: number;
  builder_id: number;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
}

const emptyForm: Omit<BuilderContact, "id" | "builder_id"> = {
  name: "",
  title: "",
  email: "",
  phone: "",
};

export default function ManageBuilderContactsModal({ isVisible, onClose, builderId, builderName }: ManageBuilderContactsModalProps) {
  const [contacts, setContacts] = useState<BuilderContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BuilderContact, "id" | "builder_id">>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");
  const [additionalPhones, setAdditionalPhones] = useState<{ type: string; number: string }[]>([]);
  const PHONE_TYPES = ["Mobile", "Office", "Home", "Fax", "Other"];

  useEffect(() => {
    if (!isVisible || !builderId) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(`/api/builder-contacts?builderId=${builderId}`);
        if (!res.ok) throw new Error("Failed to fetch builder contacts");
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch builder contacts");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isVisible, builderId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setAdditionalPhones([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderId) return;
    if (!form.name.trim()) return;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      // Combine primary and additional phones into the single `phone` field
      const combinedParts: string[] = [];
      if (form.phone && form.phone.trim()) combinedParts.push(form.phone.trim());
      additionalPhones.forEach(p => {
        if (p.number && p.number.trim()) combinedParts.push(`${p.type}:${p.number.trim()}`);
      });
      const combinedPhone = combinedParts.join(' || ');
      if (editingId) {
        const res = await fetchWithAuth(`/api/builder-contacts`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form, phone: combinedPhone || null }),
        });
        if (!res.ok) throw new Error("Failed to update contact");
        const updated = await res.json();
        setContacts((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      } else {
        const res = await fetchWithAuth(`/api/builder-contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ builder_id: builderId, ...form, phone: combinedPhone || null }),
        });
        if (!res.ok) throw new Error("Failed to add contact");
        const created = await res.json();
        setContacts((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (e: any) {
      setError(e?.message || "Failed to save contact");
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (contact: BuilderContact) => {
    setEditingId(contact.id);
    // Parse concatenated phone string into primary and extras
    const phoneStr = contact.phone || '';
    const parts = phoneStr.split(' || ').map(p => p.trim()).filter(Boolean);
    let primary = '';
    const extras: { type: string; number: string }[] = [];
    if (parts.length > 0) {
      const first = parts[0];
      if (first.includes(':')) {
        const [_, num] = first.split(':', 2);
        primary = (num || '').trim();
      } else {
        primary = first;
      }
      for (let i = 1; i < parts.length; i++) {
        const token = parts[i];
        if (token.includes(':')) {
          const [t, n] = token.split(':', 2);
          extras.push({ type: (t || 'Other').trim(), number: (n || '').trim() });
        } else if (token) {
          extras.push({ type: 'Other', number: token });
        }
      }
    }
    setForm({ name: contact.name, title: contact.title || "", email: contact.email || "", phone: primary });
    setAdditionalPhones(extras);
  };

  const askDelete = (contact: BuilderContact) => {
    setDeleteId(contact.id);
    setDeleteName(contact.name);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchWithAuth(`/api/builder-contacts?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
      setContacts((prev) => prev.filter((c) => c.id !== deleteId));
      if (editingId === deleteId) resetForm();
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to delete contact");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible || !builderId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[52.5rem] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-[var(--header-gray)] text-white p-4 rounded-t shadow-sm -mt-6 -mx-6">
            <h2 className="text-xl font-bold">Manage Contacts{builderName ? ` - ${builderName}` : ""}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              required
            />
            <input
              type="text"
              placeholder="Title"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
            <input
              type="text"
              placeholder="Phone"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
            />

            {/* Additional Phone Numbers (stored in same phone field) */}
            <div className="md:col-span-2 border-t pt-3 mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Additional Phone Numbers</label>
                <button
                  type="button"
                  onClick={() => setAdditionalPhones([...additionalPhones, { type: 'Mobile', number: '' }])}
                  className="px-3 py-1 text-sm bg-[var(--header-gray)] text-white rounded-md hover:bg-gray-800 flex items-center gap-1"
                >
                  <HiPlus className="w-4 h-4" /> Add Phone
                </button>
              </div>
              {additionalPhones.map((phone, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={phone.type}
                    onChange={(e) => {
                      const updated = [...additionalPhones];
                      updated[index].type = e.target.value;
                      setAdditionalPhones(updated);
                    }}
                    className="border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    {PHONE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone.number}
                    onChange={(e) => {
                      const updated = [...additionalPhones];
                      updated[index].number = e.target.value;
                      setAdditionalPhones(updated);
                    }}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAdditionalPhones(additionalPhones.filter((_, i) => i !== index))}
                    className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                    aria-label="Remove phone"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-2 bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white rounded-md"
              >
                {editingId ? "Update Contact" : "Add Contact"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {editingId === c.id ? (
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {editingId === c.id ? (
                        <input
                          type="text"
                          value={form.title || ""}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        c.title || ""
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {editingId === c.id ? (
                        <input
                          type="text"
                          value={form.phone || ""}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        <div className="flex flex-col gap-1">
                          {(c.phone || '').split(' || ').filter(Boolean).map((token, idx) => {
                            const parts = token.split(':');
                            const hasType = parts.length > 1;
                            const type = hasType ? parts[0].trim() : '';
                            const number = hasType ? parts.slice(1).join(':').trim() : token.trim();
                            if (!number) return null;
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                {hasType && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{type}</span>}
                                <span>{number}</span>
                              </div>
                            );
                          })}
                          {!c.phone && <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {editingId === c.id ? (
                        <input
                          type="email"
                          value={form.email || ""}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        <span className="truncate inline-block max-w-[18rem]" title={c.email || ""}>{c.email || ""}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingId === c.id ? (
                          <>
                            <button
                              onClick={(e) => handleSubmit(e as any)}
                              className="p-1 bg-[var(--primary-color)] rounded-md text-white hover:bg-[var(--secondary-color)]"
                              title="Save"
                            >
                              <HiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={resetForm}
                              className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                              title="Cancel"
                            >
                              <HiX className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                              title="Edit Contact"
                            >
                              <HiPencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => askDelete(c)}
                              className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                              title="Delete Contact"
                            >
                              <HiTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No contacts found for this builder.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        loading={isLoading}
      />
    </div>
  );
}
