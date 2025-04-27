// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Settings from './components/Settings';
// --- Import New Settings Components ---
import ProfileSettings from './components/ProfileSettings';
import SecuritySettings from './components/SecuritySettings';
import AppearanceSettings from './components/AppearanceSettings';
import AboutPage from './components/AboutPage';
// -------------------------------------

// Protected route component (remains the same as Option B from before)
const ProtectedRoute = ({ children }) => {
  const { user, loading: contextLoading } = useApp();
  const location = useLocation();
  const showInitialSpinner = contextLoading && !user;

  if (showInitialSpinner) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};


// Component containing the route definitions
function AppRoutes() {
    return (
        <div className="max-w-md mx-auto h-screen bg-white shadow-lg overflow-hidden flex flex-col">
             <Routes>
                 {/* Public routes */}
                 <Route path="/login" element={<Login />} />
                 <Route path="/signup" element={<Signup />} />

                 {/* Protected routes */}
                 <Route path="/" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
                 <Route path="/send" element={ <ProtectedRoute> <SendMoney /> </ProtectedRoute> } />
                 <Route path="/receive" element={ <ProtectedRoute> <ReceiveMoney /> </ProtectedRoute> } />
                 <Route path="/verify" element={ <ProtectedRoute> <Verification /> </ProtectedRoute> } />
                 <Route path="/graph" element={ <ProtectedRoute> <TransactionGraph /> </ProtectedRoute> } />
                 <Route path="/analytics" element={ <ProtectedRoute> <Analytics /> </ProtectedRoute> } />

                 {/* --- Settings Routes --- */}
                 <Route path="/settings" element={ <ProtectedRoute> <Settings /> </ProtectedRoute> } />
                 {/* --- Sub-Settings Routes --- */}
                 <Route path="/settings/profile" element={ <ProtectedRoute> <ProfileSettings /> </ProtectedRoute>} />
                 <Route path="/settings/security" element={ <ProtectedRoute> <SecuritySettings /> </ProtectedRoute>} />
                 <Route path="/settings/appearance" element={ <ProtectedRoute> <AppearanceSettings /> </ProtectedRoute>} />
                 <Route path="/settings/about" element={ <ProtectedRoute> <AboutPage /> </ProtectedRoute>} />
                 {/* ------------------------- */}

                 {/* Catch-all route */}
                 <Route path="*" element={<Navigate to="/" replace />} />

             </Routes>
         </div>
    );
}

// Main App component
function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;