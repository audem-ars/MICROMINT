// src/components/Settings.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
// Icons remain the same
import { User, LogOut, ShieldCheck, Palette, Info, Trash2 } from 'lucide-react';

const Settings = () => {
  const { user, logout, currentWallet } = useApp();
  const navigate = useNavigate(); // Get navigate function

  // --- Logout Handler ---
  const handleLogout = () => {
    console.log("Settings: Calling logout function...");
    logout();
  };

  // --- UPDATE Handlers to Navigate ---
  const handleProfileClick = () => navigate('/settings/profile');
  const handleSecurityClick = () => navigate('/settings/security');
  const handleAppearanceClick = () => navigate('/settings/appearance');
  const handleAboutClick = () => navigate('/settings/about');
  const handleDeleteAccountClick = () => {
     if(window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and is permanent.")) {
         console.error('Account deletion requested but API endpoint is not implemented!');
         alert('Account deletion feature not yet available.');
         // Implement backend API call for deletion, then logout
         // const success = await api.deleteAccount(token);
         // if (success) logout();
     }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header title="Settings" showBack={true} showUser={false} />

      <div className="flex-1 overflow-y-auto p-4 pb-20">

        {/* User Info Section (remains the same) */}
        {user && (
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center space-x-4 border border-gray-200">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-medium uppercase shadow-sm">
                {user.name ? user.name.charAt(0) : '?'}
             </div>
             <div>
                <p className="font-semibold text-gray-800 text-lg">{user.name || 'User Name'}</p>
                <p className="text-sm text-gray-500">{user.email || 'user@example.com'}</p>
                {currentWallet?.id && <p className="text-xs text-gray-400 mt-1">Wallet: {currentWallet.id.substring(0, 10)}...</p>}
             </div>
          </div>
        )}

        {/* Settings Options List (onClicks updated) */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
           <ul className="divide-y divide-gray-100">
              {/* Profile */}
              <li onClick={handleProfileClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <User size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Profile</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
               {/* Security */}
              <li onClick={handleSecurityClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <ShieldCheck size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Security & Privacy</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
              {/* Appearance */}
              <li onClick={handleAppearanceClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <Palette size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Appearance</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
               {/* About */}
              <li onClick={handleAboutClick} className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer flex justify-between items-center transition duration-150 ease-in-out">
                 <div className="flex items-center space-x-3">
                    <Info size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-700">About Micro Mint</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400" />
              </li>
           </ul>
        </div>

        {/* Logout Button (remains the same) */}
        <div className="mb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-red-50 border border-gray-200 text-red-600 py-3 rounded-lg font-medium transition duration-150 ease-in-out shadow-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

         {/* Delete Account Button (remains the same) */}
        <div className="text-center">
            <button
                onClick={handleDeleteAccountClick}
                className="text-xs text-gray-400 hover:text-red-500 hover:underline focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
            >
                Delete Account
            </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

// ChevronRight component (remains the same)
const ChevronRight = ({ size = 18, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default Settings;