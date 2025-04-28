// src/components/Navigation.js
import React from 'react';
// Make sure Settings is imported (it is in your provided code)
import { Activity, Plus, Settings, Network, BarChart2, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();

  const isActive = (path) => location.pathname === path || (path === '/settings' && location.pathname.startsWith('/settings/')); // Make settings active for subroutes too


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

   // Helper function for button classes
   const getButtonClasses = (path) => {
     // --- MODIFIED: Added dark text for active/inactive ---
     return `flex flex-col items-center text-xs transition-colors duration-150 ease-in-out ${
       isActive(path)
         ? 'text-blue-600 dark:text-blue-400' // Active color
         : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' // Inactive color + hover
     }`;
   };

  return (
    // --- MODIFIED: Added dark background and border ---
    <div className="bg-white border-t border-gray-200 p-4 flex justify-around dark:bg-gray-800 dark:border-gray-700">
      {/* Activity Button */}
      <button
        className={getButtonClasses('/')}
        onClick={() => navigate('/')}
      >
        <Activity size={20} className="mb-1" />
        <span>Activity</span>
      </button>

      {/* Verify Button */}
      <button
        className={getButtonClasses('/verify')}
        onClick={() => navigate('/verify')}
      >
        <Plus size={20} className="mb-1" />
        <span>Verify</span>
      </button>

      {/* Graph Button */}
      <button
        className={getButtonClasses('/graph')}
        onClick={() => navigate('/graph')}
      >
        <Network size={20} className="mb-1" />
        <span>Graph</span>
      </button>

      {/* Analytics Button */}
      <button
        className={getButtonClasses('/analytics')}
        onClick={() => navigate('/analytics')}
      >
        <BarChart2 size={20} className="mb-1" />
        <span>Analytics</span>
      </button>

      {/* Settings Button */}
      <button
         className={getButtonClasses('/settings')} // Uses '/settings' for isActive check
        onClick={() => navigate('/settings')}
      >
        <Settings size={20} className="mb-1" />
        <span>Settings</span>
      </button>

      {/* Logout Button */}
       {/* --- MODIFIED: Added dark text and hover --- */}
      <button
        className="flex flex-col items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        onClick={handleLogout}
      >
        <LogOut size={20} className="mb-1" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Navigation;