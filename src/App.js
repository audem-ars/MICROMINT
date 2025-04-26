import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';

// Import components
import Dashboard from './components/Dashboard';
import SendMoney from './components/SendMoney';
import ReceiveMoney from './components/ReceiveMoney';
import Verification from './components/Verification';
import Login from './components/Login';
import Signup from './components/Signup';
import TransactionGraph from './components/TransactionGraph';
import Analytics from './components/Analytics';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="max-w-md mx-auto h-screen bg-white shadow-lg overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/send" element={
            <ProtectedRoute>
              <SendMoney />
            </ProtectedRoute>
          } />
          
          <Route path="/receive" element={
            <ProtectedRoute>
              <ReceiveMoney />
            </ProtectedRoute>
          } />
          
          <Route path="/verify" element={
            <ProtectedRoute>
              <Verification />
            </ProtectedRoute>
          } />
          
          <Route path="/graph" element={
            <ProtectedRoute>
              <TransactionGraph />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;