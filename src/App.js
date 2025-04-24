import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Dashboard from './components/Dashboard';
import SendMoney from './components/SendMoney';
import ReceiveMoney from './components/ReceiveMoney';
import Verification from './components/Verification';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="max-w-md mx-auto h-screen bg-white shadow-lg overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<SendMoney />} />
            <Route path="/receive" element={<ReceiveMoney />} />
            <Route path="/verify" element={<Verification />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;