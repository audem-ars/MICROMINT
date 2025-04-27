import React from 'react';
// Make sure Settings is imported (it is in your provided code)
import { Activity, Plus, Settings, Network, BarChart2, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 flex justify-around">
      {/* Activity Button */}
      <button
        className={`flex flex-col items-center text-xs ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => navigate('/')}
      >
        <Activity size={20} className="mb-1" />
        <span>Activity</span>
      </button>

      {/* Verify Button */}
      <button
        className={`flex flex-col items-center text-xs ${isActive('/verify') ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => navigate('/verify')}
      >
        <Plus size={20} className="mb-1" />
        <span>Verify</span>
      </button>

      {/* Graph Button */}
      <button
        className={`flex flex-col items-center text-xs ${isActive('/graph') ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => navigate('/graph')}
      >
        <Network size={20} className="mb-1" />
        <span>Graph</span>
      </button>

      {/* Analytics Button */}
      <button
        className={`flex flex-col items-center text-xs ${isActive('/analytics') ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => navigate('/analytics')}
      >
        <BarChart2 size={20} className="mb-1" />
        <span>Analytics</span>
      </button>

      {/* Settings Button - ADDED HERE */}
      <button
        className={`flex flex-col items-center text-xs ${isActive('/settings') ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => navigate('/settings')}
      >
        <Settings size={20} className="mb-1" />
        <span>Settings</span>
      </button>
      {/* End of Added Settings Button */}

      {/* Logout Button */}
      <button
        className="flex flex-col items-center text-xs text-gray-500"
        onClick={handleLogout}
      >
        <LogOut size={20} className="mb-1" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Navigation;