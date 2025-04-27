import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

const AppearanceSettings = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header title="Appearance" showBack={true} />
       <div className="flex-1 p-6 overflow-y-auto pb-20">
         <h1 className="text-xl font-semibold mb-4">Appearance Settings</h1>
         <p className="text-gray-600">(Theme selection - Light/Dark - will go here)</p>
         {/* Add theme toggles later */}
      </div>
      <Navigation />
    </div>
  );
};
export default AppearanceSettings;