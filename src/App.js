// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';

// --- Password Reset Components ---
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// --- Your component imports remain the same ---
import Dashboard from './components/Dashboard';
import SendMoney from './components/SendMoney';
import ReceiveMoney from './components/ReceiveMoney';
import Verification from './components/Verification';
import Login from './components/Login';
import Signup from './components/Signup';
import TransactionGraph from './components/TransactionGraph';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import ProfileSettings from './components/ProfileSettings';
import SecuritySettings from './components/SecuritySettings';
import AppearanceSettings from './components/AppearanceSettings';
import AboutPage from './components/AboutPage';
// -------------------------------------------

// --- ProtectedRoute Component with Defensive Check ---
const ProtectedRoute = ({ children }) => {
  const contextValue = useApp(); // Get the whole context value first
  const location = useLocation();

  // --- Defensive Check ---
  // Check if the context value itself is available yet
  if (!contextValue) {
       // This log confirms this case is hit initially
       console.warn("ProtectedRoute rendering before context value is fully available.");
       // Show a generic loading state while context initializes
       return (
           <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-900">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div> {/* Simple spinner */}
           </div>
       );
  }
  // ---------------------

  // Now destructure safely, knowing contextValue exists
  const { user, loading: contextLoading } = contextValue;

  // Use contextLoading directly to check if data fetching is in progress
  const showInitialSpinner = contextLoading; // Rely solely on context loading flag now

  // Show main spinner WHILE context indicates loading is true
  if (showInitialSpinner) {
    // This is the spinner you are likely stuck on
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // If NOT loading, check if user exists
  if (!user) {
    // If not loading and still no user, redirect to login
    console.log("ProtectedRoute: Not loading and no user found, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If not loading and user exists, render the children
  return children;
};
// --- End ProtectedRoute ---

// --- AppRoutes component with password reset routes added ---
function AppRoutes() {
    return (
        <div className="max-w-md mx-auto h-screen bg-white shadow-lg overflow-hidden flex flex-col dark:bg-gray-800 dark:shadow-slate-700/50 border border-gray-200 dark:border-gray-700">
             <Routes>
                 {/* Public routes */}
                 <Route path="/login" element={<Login />} />
                 <Route path="/signup" element={<Signup />} />
                 
                 {/* Password Reset Routes */}
                 <Route path="/forgot-password" element={<ForgotPassword />} />
                 <Route path="/reset-password" element={<ResetPassword />} />

                 {/* Protected routes */}
                 <Route path="/" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
                 <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
                 <Route path="/send" element={ <ProtectedRoute> <SendMoney /> </ProtectedRoute> } />
                 <Route path="/receive" element={ <ProtectedRoute> <ReceiveMoney /> </ProtectedRoute> } />
                 <Route path="/verify" element={ <ProtectedRoute> <Verification /> </ProtectedRoute> } />
                 <Route path="/graph" element={ <ProtectedRoute> <TransactionGraph /> </ProtectedRoute> } />
                 <Route path="/analytics" element={ <ProtectedRoute> <Analytics /> </ProtectedRoute> } />

                 {/* Settings Routes */}
                 <Route path="/settings" element={ <ProtectedRoute> <Settings /> </ProtectedRoute> } />
                 {/* Sub-Settings Routes */}
                 <Route path="/settings/profile" element={ <ProtectedRoute> <ProfileSettings /> </ProtectedRoute>} />
                 <Route path="/settings/security" element={ <ProtectedRoute> <SecuritySettings /> </ProtectedRoute>} />
                 <Route path="/settings/appearance" element={ <ProtectedRoute> <AppearanceSettings /> </ProtectedRoute>} />
                 <Route path="/settings/about" element={ <ProtectedRoute> <AboutPage /> </ProtectedRoute>} />

                 {/* Catch-all route */}
                 <Route path="*" element={<Navigate to="/" replace />} />

             </Routes>
         </div>
    );
}
// -------------------------------------------------

// --- Main App component remains exactly the same ---
function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}
// -------------------------------------------------

export default App;