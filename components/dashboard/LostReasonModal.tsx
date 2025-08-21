'use client';

import React, { useState } from 'react';
import { HiX } from 'react-icons/hi';

interface LostReasonModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}

export default function LostReasonModal({ isVisible, onClose, onSubmit, loading }: LostReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason cannot be empty.');
      return;
    }
    setError(null);
    onSubmit(reason);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4 bg-gray-800 text-white p-3 rounded-t -mt-5 -mx-5 shadow-md">
            <h2 className="text-lg font-bold">Reason for Lost Project</h2>
            <button onClick={onClose} className="text-white hover:text-gray-300">
              <HiX className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason why this project was marked as lost. This is required.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              rows={4}
              placeholder="Enter reason here..."
              required
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="mt-5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
