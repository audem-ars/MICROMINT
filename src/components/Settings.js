// src/components/Settings.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import { User, LogOut, ShieldCheck, Palette, Info, ExternalLink, Trash2 } from 'lucide-react'; // Example icons

const Settings = () => {
  const { user, logout, currentWallet } = useApp(); // Get user, logout fn, and wallet
  const navigate = useNavigate();

  // --- Logout Handler ---
  const handleLogout = () => {
    console.log("Settings: Calling logout function...");
    logout();
    // No need to navigate here, ProtectedRoute in App.js will handle redirection
    // navigate('/login'); // This might cause issues if context clears slightly later
  };

  // --- Placeholder Handlers for Other Settings ---
  // Replace these with navigation or modal logic for real settings
  const handleProfileClick = () => alert('Navigate to Profile Edit page (Not Implemented)');
  const handleSecurityClick = () => alert('Navigate to Security Settings page (Not Implemented)');
  const handleAppearanceClick = () => alert('Open Appearance Settings (Not Implemented)');
  const handleAboutClick = () => alert('Show About/Info Modal (Not Implemented)');
  const handleDeleteAccountClick = () => {
     // !! IMPORTANT: Add a confirmation dialog here before proceeding !!
     if(window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
         alert('Call account deletion API (Not Implemented)');
         // Implement backend API call for deletion, then logout
         // logout();
     }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Use the standard Header */}
      <Header title="Settings" showBack={true} showUser={false} /* Hide profile icon on settings page itself */ />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">

        {/* User Info Section */}
        {user && (
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center space-x-4 border border-gray-200">
             {/* User Avatar/Initial */}
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-medium uppercase shadow-sm">
                {user.name ? user.name.charAt(0) : '?'}
             </div>
             {/* User Details */}
             <div>
                <p className="font-semibold text-gray-800 text-lg">{user.name || 'User Name'}</p>
                <p className="text-sm text-gray-500">{user.email || 'user@example.com'}</p>
                {/* Display truncated Wallet ID if available */}
                {currentWallet?.id && <p className="text-xs text-gray-400 mt-1">Wallet: {currentWallet.id.substring(0, 10)}...</p>}
             </div>
          </div>
        )}

        {/* Settings Options List */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
           <ul className="divide-y divide-gray-100">
              {/* Profile */}
              <li onClick={handleProfileClick} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <User size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Profile</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" /> {/* Use ChevronRight */}
              </li>
               {/* Security */}
              <li onClick={handleSecurityClick} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <ShieldCheck size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Security & Privacy</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
              {/* Appearance */}
              <li onClick={handleAppearanceClick} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <Palette size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Appearance</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
               {/* About */}
              <li onClick={handleAboutClick} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <Info size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">About Micro Mint</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
           </ul>
        </div>

        {/* Logout Button */}
        <div className="mb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-red-50 border border-gray-200 text-red-600 py-3 rounded-lg font-medium transition duration-150 ease-in-out shadow-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

         {/* Delete Account Button (Dangerous Action) */}
        <div className="text-center">
            <button
                onClick={handleDeleteAccountClick}
                className="text-xs text-gray-400 hover:text-red-500 hover:underline"
            >
                Delete Account
            </button>
        </div>


      </div> {/* End Scrollable Area */}

      {/* Navigation */}
      <Navigation />
    </div> // End Main Container
  );
};

// Need ChevronRight for the list items
const ChevronRight = ({ size = 18, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);


export default Settings;