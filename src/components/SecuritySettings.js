import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

const SecuritySettings = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header title="Security & Privacy" showBack={true} />
      <div className="flex-1 p-6 overflow-y-auto pb-20">
         <h1 className="text-xl font-semibold mb-4">Security Options</h1>
         <p className="text-gray-600">(Password change, MFA, privacy settings will go here)</p>
         {/* Add security options later */}
      </div>
      <Navigation />
    </div>
  );
};
export default SecuritySettings;