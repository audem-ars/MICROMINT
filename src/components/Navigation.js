import React from 'react';
import { Activity, Plus, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="bg-white border-t border-gray-200 p-4 flex justify-around">
      <button 
        className={`flex flex-col items-center text-xs ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}
        onClick={() => navigate('/')}
      >
        <Activity size={20} className="mb-1" />
        <span>Activity</span>
      </button>
      
      <button 
        className="flex flex-col items-center text-xs text-gray-500"
        onClick={() => navigate('/verify')}
      >
        <Plus size={20} className="mb-1" />
        <span>Verify</span>
      </button>
      
      <button 
        className="flex flex-col items-center text-xs text-gray-500"
      >
        <Settings size={20} className="mb-1" />
        <span>Settings</span>
      </button>
    </div>
  );
};

export default Navigation;