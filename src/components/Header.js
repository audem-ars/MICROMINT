// src/components/Header.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, UserCircle, ChevronDown } from 'lucide-react'; // Renamed Settings import
import { useApp } from '../contexts/AppContext'; // Import useApp for user info

const Header = ({ title, showBack = false, showUser = true, userName = 'User', showCurrency = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCurrency, setSelectedCurrency } = useApp(); // Get currency state if needed

  const handleBack = () => {
    // Navigate back, or to dashboard if history is empty/at root
    if (window.history.length > 1 && location.key !== 'default') { // Check if there's history
        navigate(-1);
    } else {
        navigate('/'); // Fallback to dashboard
    }
  };

  const goToSettings = () => {
    console.log("Profile icon clicked, navigating to /settings");
    navigate('/settings');
  };

  // TODO: Implement currency selection logic if needed
  const handleCurrencyChange = (newCurrency) => {
     if (setSelectedCurrency) {
         setSelectedCurrency(newCurrency);
         console.log("Currency changed to:", newCurrency);
     }
  };

  return (
    // Use sticky header? `sticky top-0 z-10` can work but needs careful layout adjustments in parent
    <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">

      {/* Left Side: Back Button or Placeholder */}
      <div className="w-10"> {/* Fixed width for alignment */}
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          // Keep space even if no back button for title centering
          <div className="w-8 h-8"></div>
        )}
      </div>

      {/* Center: Title or Currency Selector */}
      <div className="flex-1 text-center">
          {showCurrency && setSelectedCurrency ? (
              // Example Currency Dropdown (Needs proper implementation)
              <button className="flex items-center justify-center mx-auto font-semibold text-lg">
                  <span>{selectedCurrency}</span>
                  <ChevronDown size={18} className="ml-1 opacity-50" />
              </button>
              // Replace button with a real <select> or custom dropdown component
          ) : (
              <h1 className="text-lg font-semibold text-gray-800 truncate">{title}</h1>
          )}
      </div>


      {/* Right Side: Profile/Settings Icon or Placeholder */}
      <div className="w-10 flex justify-end"> {/* Fixed width for alignment */}
        {showUser ? (
          <button
            onClick={goToSettings}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            aria-label="User Settings"
          >
            {/* Option 1: Generic User Icon */}
            {/* <UserCircle size={24} strokeWidth={1.5} /> */}

            {/* Option 2: User Initial */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-medium uppercase shadow-sm">
                {userName ? userName.charAt(0) : '?'}
            </div>
          </button>
        ) : (
           <div className="w-8 h-8"></div> // Keep space if no icon shown
        )}
      </div>
    </div>
  );
};

export default Header;