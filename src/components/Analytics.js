// src/components/Analytics.js
import React, { useState, useEffect } from 'react';
// Make sure 'user' is kept in the destructuring below
import { useApp } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header'; // IMPORTANT: Ensure Header is updated
import Navigation from './Navigation'; // IMPORTANT: Ensure Navigation is updated

const Analytics = () => {
  // Keep 'user' here because we will use it now
  const { transactions, balance, user, theme } = useApp(); // <-- Get theme
  const [weeklyData, setWeeklyData] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    verifications: 0,
    avgTxSize: 0
  });

  // --- Your exact useEffect logic ---
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      let sent = 0;
      let received = 0;
      let verifications = 0;
      let txSizes = [];

      transactions.forEach(tx => {
        if (tx.type === 'send') {
          sent += tx.amount;
          txSizes.push(tx.amount);
        } else if (tx.type === 'receive') {
          received += tx.amount;
          txSizes.push(tx.amount);
        } else if (tx.type === 'verify') {
          verifications++;
        }
      });

      setStats({
        totalSent: sent,
        totalReceived: received,
        verifications,
        avgTxSize: txSizes.length > 0 ? txSizes.reduce((a, b) => a + b, 0) / txSizes.length : 0
      });

      const now = new Date();
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        days.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.toISOString().slice(0, 10),
          sent: 0,
          received: 0,
          verified: 0
        });
      }

      transactions.forEach(tx => {
        const txDate = new Date(tx.timestamp);
        if (txDate >= oneWeekAgo) {
          const dateStr = txDate.toISOString().slice(0, 10);
          const dayIndex = days.findIndex(d => d.date === dateStr);
          if (dayIndex !== -1) {
            if (tx.type === 'send') {
              days[dayIndex].sent += tx.amount;
            } else if (tx.type === 'receive') {
              days[dayIndex].received += tx.amount;
            } else if (tx.type === 'verify') {
              days[dayIndex].verified += (tx.amount || 1);
            }
          }
        }
      });
      setWeeklyData(days);
    }
  }, [transactions]);

  // --- Determine text/grid colors based on theme for Recharts ---
  const isDarkMode = theme === 'dark';
  const tickColor = isDarkMode ? '#9CA3AF' : '#6B7280'; // gray-400 : gray-500
  const gridColor = isDarkMode ? '#374151' : '#E5E7EB'; // gray-700 : gray-200
  const tooltipBg = isDarkMode ? '#1F2937' : '#FFFFFF'; // gray-800 : white
  const tooltipText = isDarkMode ? '#F3F4F6' : '#111827'; // gray-100 : gray-900

  return (
    // --- MODIFIED: Added dark background ---
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Analytics" showBack={true} />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 md:p-6">

          {/* Personalized Subtitle */}
          {user && user.name && (
             // --- MODIFIED: Added dark text ---
            <h3 className="text-md text-center text-gray-600 dark:text-gray-400 mb-4 md:text-lg">
              Activity Overview for <span className="font-semibold dark:text-gray-200">{user.name}</span>
            </h3>
          )}

          {/* Activity Summary Card */}
          {/* --- MODIFIED: Added dark background, border, text --- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Activity Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Stat Item */}
               {/* --- MODIFIED: Added dark background, text --- */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Sent</div>
                 {/* Text color likely fine */}
                <div className="text-xl font-bold text-red-600 dark:text-red-500">
                  ${stats.totalSent.toFixed(2)}
                </div>
              </div>
              {/* Stat Item */}
               {/* --- MODIFIED: Added dark background, text --- */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Received</div>
                 {/* Text color likely fine */}
                <div className="text-xl font-bold text-green-600 dark:text-green-500">
                  ${stats.totalReceived.toFixed(2)}
                </div>
              </div>
              {/* Stat Item */}
               {/* --- MODIFIED: Added dark background, text --- */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Verifications</div>
                 {/* --- MODIFIED: Added dark text --- */}
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.verifications}</div>
              </div>
              {/* Stat Item */}
               {/* --- MODIFIED: Added dark background, text --- */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Avg. Transaction</div>
                 {/* --- MODIFIED: Added dark text --- */}
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  ${stats.avgTxSize.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart Card */}
           {/* --- MODIFIED: Added dark background, border, text --- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Weekly Activity</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  {/* --- MODIFIED: Use themed grid color --- */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  {/* --- MODIFIED: Use themed tick color --- */}
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} axisLine={{ stroke: tickColor }} tickLine={{ stroke: tickColor }}/>
                  <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={{ stroke: tickColor }} tickLine={{ stroke: tickColor }} />
                  <Tooltip
                    // --- MODIFIED: Use themed background and text colors ---
                    contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: gridColor, // Use grid color for border
                        color: tooltipText,
                        borderRadius: '8px',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: tooltipText }} // Ensure item text color also matches
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                  {/* --- MODIFIED: Use themed legend text color --- */}
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: tickColor }} />
                   {/* Keep Bar fill colors, or adjust slightly for dark mode if desired */}
                  <Bar dataKey="sent" fill="#EF4444" name="Sent ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" fill="#10B981" name="Received ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="verified" fill="#3B82F6" name="Verified (Reward/Count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction Insights Card */}
           {/* --- MODIFIED: Added dark background, border, text --- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Quick Insights</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                 {/* --- MODIFIED: Added dark text --- */}
                <span className="text-gray-600 dark:text-gray-300">Network Contribution:</span>
                 {/* --- MODIFIED: Added dark background, text --- */}
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${stats.verifications > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'}`}>
                  {stats.verifications > 0 ? 'Active Verifier' : 'User'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 {/* --- MODIFIED: Added dark text --- */}
                <span className="text-gray-600 dark:text-gray-300">Transaction Volume (USD):</span>
                 {/* --- MODIFIED: Added dark background, text --- */}
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${stats.totalSent + stats.totalReceived > 1000 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {stats.totalSent + stats.totalReceived > 1000 ? 'High' : (stats.totalSent + stats.totalReceived > 0 ? 'Moderate' : 'Low')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 {/* --- MODIFIED: Added dark text --- */}
                <span className="text-gray-600 dark:text-gray-300">MM Token Balance:</span>
                 {/* --- MODIFIED: Added dark text --- */}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {balance.MM?.toFixed(2) || '0.00'} MM
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default Analytics;