import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import Transaction from './Transaction';

const Dashboard = () => {
  const navigate = useNavigate();
  const { balance, selectedCurrency, transactions } = useApp();
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col p-6 bg-white">
        <Header title="Balance" showCurrency={true} />
        
        <div className="text-4xl font-bold mb-6">
          {selectedCurrency === 'USD' && '$'}
          {selectedCurrency === 'EUR' && '€'}
          {balance[selectedCurrency].toFixed(2)}
          {selectedCurrency === 'MM' && ' MM'}
        </div>
        
        <div className="flex space-x-3 mb-6">
          <button 
            onClick={() => navigate('/send')}
            className="flex-1 bg-black text-white py-3 rounded-lg flex justify-center items-center font-medium"
          >
            <span className="mr-2">Send</span>
            <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => navigate('/receive')}
            className="flex-1 bg-gray-100 py-3 rounded-lg flex justify-center items-center font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Receive</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Activity</h2>
          <button 
            onClick={() => navigate('/verify')}
            className="text-sm text-blue-600"
          >
            Verify Transactions
          </button>
        </div>
        
        {transactions.length > 0 ? (
          transactions.map(transaction => (
            <Transaction key={transaction.id} transaction={transaction} />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            No transactions yet
          </div>
        )}
      </div>
      
      <Navigation />
    </div>
  );
};

export default Dashboard;