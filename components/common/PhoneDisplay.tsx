import React, { useState } from 'react';

interface PhoneDisplayProps {
  phoneNumber: string;
}

const PhoneDisplay: React.FC<PhoneDisplayProps> = ({ phoneNumber }) => {
  const [copied, setCopied] = useState(false);
  
  // Function to copy phone number to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Format phone number for display (you can adjust this as needed)
  const formatPhoneNumber = (phone: string) => {
    // Keep the formatting as-is for now, but you could add formatting here
    return phone;
  };

  return (
    <div className="flex items-center">
      <span className="text-blue-700">{formatPhoneNumber(phoneNumber)}</span>
      <div className="ml-2 flex space-x-1">
        <button
          onClick={copyToClipboard}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
          title="Copy to clipboard"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <a 
          href={`tel:${phoneNumber}`}
          className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-0.5 rounded"
          target="_blank"
          rel="noopener noreferrer"
        >
          Call
        </a>
      </div>
    </div>
  );
};

export default PhoneDisplay;
