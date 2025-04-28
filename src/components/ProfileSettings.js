import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
// import * as api from '../services/api'; // Import API service when ready

const ProfileSettings = () => {
  const { user, token, updateLocalUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Initialize form fields when user data is available
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    if (!name || !email) {
      setMessage('Name and Email are required.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      // --- Placeholder for API Call ---
      console.log('Updating profile with:', { name, email });
      // const updatedUser = await api.updateProfile({ name, email }, token); // Replace with actual API call
      // Simulating API success after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedUser = { ...user, name, email }; // Simulate response
      // ---------------------------------

      updateLocalUser(updatedUser); // Update user data in context locally
      setMessage('Profile updated successfully!');
      setMessageType('success');

    } catch (error) {
      console.error('Profile update failed:', error);
      setMessage(error.response?.data?.message || 'Failed to update profile. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header title="Profile Settings" showBack={true} />
      <div className="flex-1 p-6 overflow-y-auto pb-20">
        <h1 className="text-xl font-semibold mb-6">Edit Profile</h1>

        {message && (
          <div className={`p-3 rounded-md mb-4 text-sm ${
            messageType === 'success'
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              disabled={isLoading} // Consider if email should be editable
            />
            {/* You might want to disable email editing or add a verification flow */}
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Changing email might require re-verification.</p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition duration-150 ease-in-out ${
                isLoading
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
      <Navigation />
    </div>
  );
};
export default ProfileSettings;