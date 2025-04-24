import React from 'react';
import { ArrowLeft, ChevronDown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const Header = ({ title, showBack = false, showUser = true, showCurrency = false }) => {
  const navigate = useNavigate();
  const { selectedCurrency, setSelectedCurrency } = useApp();
  
  const currencies = ['USD', 'EUR', 'MM'];
  
  const handleCurrencyClick = () => {
    // Simple rotation through available currencies
    const currentIndex = currencies.indexOf(selectedCurrency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setSelectedCurrency(currencies[nextIndex]);
  };
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        <h1 className="text-xl font-medium">{title}</h1>
        
        {showCurrency && (
          <div 
            className="flex items-center bg-gray-100 rounded-full px-3 py-1 ml-2 cursor-pointer"
            onClick={handleCurrencyClick}
          >
            <span className="mr-1">{selectedCurrency}</span>
            <ChevronDown size={16} />
          </div>
        )}
      </div>
      
      {showUser && (
        <User size={24} className="text-gray-500 cursor-pointer" />
      )}
    </div>
  );
};

export default Header;