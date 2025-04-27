import React from 'react';
// Added useLocation import
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
import Settings from './components/Settings'; // Make sure this component exists

// Protected route component - REVISED (Option B)
const ProtectedRoute = ({ children }) => {
  // Get user and loading state from context
  const { user, loading: contextLoading } = useApp();
  // Get current location for potential redirects after login
  const location = useLocation();

  // Determine if this is the very initial load (no user data yet)
  const showInitialSpinner = contextLoading && !user;

  if (showInitialSpinner) {
    // Show full screen spinner ONLY on initial app load before user is fetched
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        {/* You could add "Loading Account..." text here */}
      </div>
    );
  }

  if (!user) {
    // If it's not the initial load anymore and there's still no user,
    // redirect to login. Pass the current location in state
    // so the login page can redirect back here after success.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user exists, render the requested child component (e.g., Dashboard, Verification).
  // Any loading state changes during data refreshes (contextLoading = true)
  // should be handled *inside* the child components to show internal indicators
  // or disable inputs, rather than unmounting the entire component here.
  return children;
};


// Component containing the route definitions
function AppRoutes() {
    return (
        // Main container styling
        <div className="max-w-md mx-auto h-screen bg-white shadow-lg overflow-hidden flex flex-col">
             {/* Define all application routes */}
             <Routes>
                 {/* --- Public Routes --- */}
                 <Route path="/login" element={<Login />} />
                 <Route path="/signup" element={<Signup />} />

                 {/* --- Protected Routes (require login) --- */}
                 <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                 />
                 <Route
                    path="/send"
                    element={
                        <ProtectedRoute>
                            <SendMoney />
                        </ProtectedRoute>
                    }
                 />
                 <Route
                    path="/receive"
                    element={
                        <ProtectedRoute>
                            <ReceiveMoney />
                        </ProtectedRoute>
                    }
                  />
                 <Route
                    path="/verify"
                    element={
                        <ProtectedRoute>
                            <Verification />
                        </ProtectedRoute>
                    }
                 />
                 <Route
                    path="/graph"
                    element={
                         <ProtectedRoute>
                            <TransactionGraph />
                         </ProtectedRoute>
                    }
                 />
                 <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                 />
                 <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                 />

                 {/* --- Catch-all Route --- */}
                 {/* Redirect any unknown paths to the dashboard */}
                 <Route path="*" element={<Navigate to="/" replace />} />

             </Routes>
         </div>
    );
}

// Main App component - Sets up Provider and Router
function App() {
  return (
    <AppProvider> {/* Provides context to all components */}
      <Router> {/* Enables routing capabilities */}
        <AppRoutes /> {/* Renders the actual routes */}
      </Router>
    </AppProvider>
  );
}

export default App;