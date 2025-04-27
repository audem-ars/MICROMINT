// src/components/Settings.js (Temporary Test)
import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

const Settings = () => {
  console.log("Rendering Settings component..."); // Add a log

  return (
    <div className="flex flex-col h-screen bg-gray-100">
        <Header title="Settings" showBack={true} />
        <div className="flex-1 overflow-y-auto p-6 pb-20">
            <h1 className="text-xl font-semibold mb-4">Settings Page</h1>
            <p>Basic settings component rendered successfully.</p>
            {/* Add actual settings options later */}
        </div>
        <Navigation />
    </div>
  );
};

export default Settings;