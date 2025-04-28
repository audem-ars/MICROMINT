import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Header from './Header';
import Navigation from './Navigation';
// import * as api from '../services/api'; // Import API service when ready

const SecuritySettings = () => {
  const { token } = useApp(); // Need token for API call
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    // Basic Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('All password fields are required.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) { // Example minimum length
      setMessage('New password must be at least 8 characters long.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }
     if (newPassword === currentPassword) {
       setMessage('New password must be different from the current password.');
       setMessageType('error');
       setIsLoading(false);
       return;
     }

    try {
      // --- Placeholder for API Call ---
      console.log('Changing password...');
      // await api.changePassword({ currentPassword, newPassword }, token); // Replace with actual API call
      // Simulating API success after 1.5 seconds
      await new Promise((resolve, reject) => {
          // Simulate potential errors
          if (currentPassword === 'wrongpassword') {
              setTimeout(() => reject(new Error("Incorrect current password")), 1500);
          } else {
              setTimeout(resolve, 1500);
          }
      });
      // ---------------------------------

      setMessage('Password changed successfully!');
      setMessageType('success');
      // Clear fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Password change failed:', error);
      setMessage(error.response?.data?.message || error.message || 'Failed to change password. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header title="Security & Privacy" showBack={true} />
      <div className="flex-1 p-6 overflow-y-auto pb-20 space-y-6">
        <div>
            <h1 className="text-xl font-semibold mb-4">Change Password</h1>

             {message && (
              <div className={`p-3 rounded-md mb-4 text-sm ${
                messageType === 'success'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div>
                <label htmlFor="currentPassword"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="newPassword"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                  disabled={isLoading}
                />
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 8 characters long.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                  disabled={isLoading}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full mt-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition duration-150 ease-in-out ${
                    isLoading
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
        </div>

        {/* Placeholder for future settings */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
             <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Other Security Options</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400">Two-Factor Authentication (2FA) and session management features coming soon.</p>
        </div>

      </div>
      <Navigation />
    </div>
  );
};
export default SecuritySettings;