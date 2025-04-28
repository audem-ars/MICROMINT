import React from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
import { Sun, Moon } from 'lucide-react'; // Import icons

const AppearanceSettings = () => {
  const { theme, setTheme } = useApp(); // Get theme state and setter from context

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header title="Appearance" showBack={true} />
       <div className="flex-1 p-6 overflow-y-auto pb-20 space-y-6">
         <h1 className="text-xl font-semibold mb-4">Theme Preference</h1>

         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how Micro Mint looks to you. Select a theme below.
            </p>
            <div className="space-y-3">
               {/* Light Mode Option */}
               <label
                 htmlFor="light-theme"
                 className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors duration-150 ${
                   theme === 'light'
                     ? 'border-blue-500 bg-blue-50 dark:bg-opacity-20'
                     : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                 }`}
               >
                 <div className="flex items-center space-x-3">
                    <Sun size={20} className="text-yellow-500" />
                    <span className="font-medium text-sm">Light Mode</span>
                 </div>
                 <input
                    type="radio"
                    id="light-theme"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:checked:bg-blue-500"
                 />
               </label>

               {/* Dark Mode Option */}
               <label
                 htmlFor="dark-theme"
                 className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors duration-150 ${
                   theme === 'dark'
                     ? 'border-blue-500 bg-blue-50 dark:bg-opacity-20' // Adjust dark selected bg if needed
                     : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                 }`}
               >
                 <div className="flex items-center space-x-3">
                    <Moon size={20} className="text-indigo-400" />
                    <span className="font-medium text-sm">Dark Mode</span>
                 </div>
                 <input
                    type="radio"
                    id="dark-theme"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:checked:bg-blue-500"
                 />
               </label>

               {/* Optional: System Preference Option */}
               {/*
               <label htmlFor="system-theme" className="...">
                 <span>Use System Setting</span>
                 <input type="radio" id="system-theme" name="theme" value="system" ... />
               </label>
               */}
            </div>
         </div>

      </div>
      <Navigation />
    </div>
  );
};
export default AppearanceSettings;