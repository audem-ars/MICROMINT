// src/components/Settings.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header'; // IMPORTANT: Ensure Header has dark styles added too
import Navigation from './Navigation'; // IMPORTANT: Ensure Navigation has dark styles added too
// Icons remain the same
import { User, LogOut, ShieldCheck, Palette, Info, Trash2, ChevronRight as OriginalChevron } from 'lucide-react'; // Use OriginalChevron alias to avoid conflict

const Settings = () => {
  const { user, logout, currentWallet } = useApp();
  const navigate = useNavigate(); // Get navigate function

  // --- Logout Handler ---
  const handleLogout = () => {
    console.log("Settings: Calling logout function..."); // Your log
    logout();
  };

  // --- UPDATE Handlers to Navigate ---
  const handleProfileClick = () => navigate('/settings/profile');
  const handleSecurityClick = () => navigate('/settings/security');
  const handleAppearanceClick = () => navigate('/settings/appearance');
  const handleAboutClick = () => navigate('/settings/about');
  const handleDeleteAccountClick = () => {
     if(window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and is permanent.")) {
         console.error('Account deletion requested but API endpoint is not implemented!'); // Your log
         alert('Account deletion feature not yet available.');
         // Implement backend API call for deletion, then logout
         // const success = await api.deleteAccount(token);
         // if (success) logout();
     }
  };


  return (
    // --- MODIFIED: Added dark background ---
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Assuming Header handles its own dark mode */}
      <Header title="Settings" showBack={true} showUser={false} />

      <div className="flex-1 overflow-y-auto p-4 pb-20">

        {/* User Info Section */}
        {user && (
          // --- MODIFIED: Added dark background, border, shadow ---
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center space-x-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/30">
             {/* Avatar gradient likely fine */}
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-medium uppercase shadow-sm">
                {user.name ? user.name.charAt(0) : '?'}
             </div>
             <div>
                 {/* --- MODIFIED: Added dark text --- */}
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{user.name || 'User Name'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email || 'user@example.com'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Wallet: {currentWallet?.id ? `${currentWallet.id.substring(0, 10)}...` : 'N/A'}</p>
             </div>
          </div>
        )}

        {/* Settings Options List */}
        {/* --- MODIFIED: Added dark background, border, shadow --- */}
        <div className="bg-white rounded-lg shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/30 overflow-hidden mb-6">
            {/* --- MODIFIED: Added dark divide color --- */}
           <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {/* Profile */}
              {/* --- MODIFIED: Added dark hover/active background, text colors --- */}
              <li onClick={handleProfileClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    {/* --- MODIFIED: Added dark icon text --- */}
                    <User size={18} className="text-gray-500 dark:text-gray-400" />
                     {/* --- MODIFIED: Added dark span text --- */}
                    <span className="text-sm text-gray-700 dark:text-gray-200">Profile</span>
                 </div>
                  {/* --- MODIFIED: Pass dark text class to ChevronRight --- */}
                 <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </li>
               {/* Security */}
               {/* --- MODIFIED: Added dark hover/active background, text colors --- */}
              <li onClick={handleSecurityClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <ShieldCheck size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Security & Privacy</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </li>
              {/* Appearance */}
              {/* --- MODIFIED: Added dark hover/active background, text colors --- */}
              <li onClick={handleAppearanceClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <Palette size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Appearance</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </li>
               {/* About */}
               {/* --- MODIFIED: Added dark hover/active background, text colors --- */}
              <li onClick={handleAboutClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <Info size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">About Micro Mint</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              </li>
           </ul>
        </div>

        {/* Logout Button */}
        <div className="mb-6">
           {/* --- MODIFIED: Added dark background, border, text, hover --- */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-red-50 border border-gray-200 text-red-600 py-3 rounded-lg font-medium transition duration-150 ease-in-out shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

         {/* Delete Account Button */}
        <div className="text-center">
             {/* --- MODIFIED: Added dark text, hover, focus --- */}
            <button
                onClick={handleDeleteAccountClick}
                className="text-xs text-gray-400 hover:text-red-500 hover:underline focus:outline-none focus:ring-1 focus:ring-red-500 rounded dark:text-gray-500 dark:hover:text-red-400 dark:focus:ring-red-400"
            >
                Delete Account
            </button>
        </div>
      </div>

      {/* Assuming Navigation handles its own dark mode */}
      <Navigation />
    </div>
  );
};

// ChevronRight component - Receives className prop for color control
const ChevronRight = ({ size = 18, className = "" }) => (
    // Using OriginalChevron alias to avoid naming conflict if needed elsewhere
    <OriginalChevron size={size} className={className} strokeWidth="2" />
);

export default Settings;