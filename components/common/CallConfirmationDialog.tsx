import React from 'react';

interface CallConfirmationDialogProps {
  isOpen: boolean;
  phoneNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CallConfirmationDialog: React.FC<CallConfirmationDialogProps> = ({
  isOpen,
  phoneNumber,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg max-w-sm w-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Call Confirmation</h3>
          <p className="text-gray-600 mb-4">
            Would you like to call <span className="font-medium">{phoneNumber}</span>?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallConfirmationDialog;
