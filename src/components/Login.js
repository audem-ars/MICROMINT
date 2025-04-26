// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
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
          <h2 className="text-xl font-semibold mb-6">Log in to your account</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Logging in...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;