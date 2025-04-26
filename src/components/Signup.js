// src/components/Signup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Micro Mint</h1>
          <p className="text-gray-600 mt-2">Zero-fee decentralized financial network</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Create an account</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;