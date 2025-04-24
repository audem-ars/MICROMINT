import React from 'react';
import { Check, Clock } from 'lucide-react';

const Transaction = ({ transaction }) => {
  const { type, amount, currency, recipient, sender, description, date, status } = transaction;
  
  // Color and sign based on transaction type
  const getAmountDisplay = () => {
    if (type === 'send') {
      return <span className="text-gray-800">- {amount.toFixed(2)} {currency}</span>;
    } else if (type === 'receive') {
      return <span className="text-green-600">+ {amount.toFixed(2)} {currency}</span>;
    } else if (type === 'verify') {
      return <span className="text-blue-600">+ {amount.toFixed(2)} {currency}</span>;
    }
    return <span>{amount.toFixed(2)} {currency}</span>;
  };
  
  // Description based on type
  const getDescription = () => {
    if (type === 'send') {
      return `To: ${recipient}`;
    } else if (type === 'receive') {
      return `From: ${sender}`;
    } else if (type === 'verify') {
      return description || 'Verification reward';
    }
    return '';
  };
  
  // Status indicator
  const StatusIndicator = () => {
    if (status === 'pending') {
      return <Clock size={14} className="text-yellow-500 ml-1" />;
    } else if (status === 'completed') {
      return <Check size={14} className="text-green-500 ml-1" />;
    }
    return null;
  };
  
  return (
    <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <div className="flex justify-between mb-1">
        <span className="font-medium">
          {getAmountDisplay()}
        </span>
        <div className="flex items-center text-gray-500">
          <span>{date}</span>
          <StatusIndicator />
        </div>
      </div>
      <div className="text-sm text-gray-500">
        {getDescription()}
      </div>
    </div>
  );
};

export default Transaction;