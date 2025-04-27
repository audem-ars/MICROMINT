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
import Settings from './components/Settings'; // <--- Import Settings component

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp(); // Use context to check auth state

  if (loading) {
    // Show loading indicator while context is initializing
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        {/* Optional: Add text like "Loading..." */}
      </div>
    );
  }

  if (!user) {
    // If not loading and no user, redirect to login
    // Pass the intended destination via state so login can redirect back (optional)
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />; // Simpler redirect
  }

  // If loading is done and user exists, render the child component
  return children;
};


// Renamed to AppRoutes for clarity, moved Router outside
function AppRoutes() {
    return (
        <div className="max-w-md mx-auto h-screen bg-white shadow-lg overflow-hidden flex flex-col"> {/* Ensure flex column */}
             {/* Using Routes directly inside the container */}
             <Routes>
                 {/* Public routes */}
                 <Route path="/login" element={<Login />} />
                 <Route path="/signup" element={<Signup />} />

                 {/* Protected routes */}
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

                 {/* --- ADDED SETTINGS ROUTE --- */}
                 <Route path="/settings" element={
                     <ProtectedRoute>
                         <Settings />
                     </ProtectedRoute>
                 } />
                 {/* --- END ADDED SETTINGS ROUTE --- */}

                 {/* Optional: Catch-all route for 404 or redirect */}
                 <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect unknown paths to dashboard */}

             </Routes>
         </div>
    );
}

// Main App component wraps everything with Provider and Router
function App() {
  return (
    <AppProvider>
      <Router> {/* Router should wrap the component containing Routes */}
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;