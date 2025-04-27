import React from 'react';
import Header from './Header';
import Navigation from './Navigation'; // Keep consistent layout

const ProfileSettings = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header title="Profile Settings" showBack={true} />
      <div className="flex-1 p-6 overflow-y-auto pb-20">
        <h1 className="text-xl font-semibold mb-4">Edit Profile</h1>
        <p className="text-gray-600">(Profile editing form will go here)</p>
        {/* Add form fields later */}
      </div>
      <Navigation />
    </div>
  );
};
export default ProfileSettings;