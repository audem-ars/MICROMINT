import React, { useState, useEffect } from 'react';
// Make sure 'user' is kept in the destructuring below
import { useApp } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header';
import Navigation from './Navigation';

const Analytics = () => {
  // Keep 'user' here because we will use it now
  const { transactions, balance, user } = useApp();
  const [weeklyData, setWeeklyData] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    verifications: 0,
    avgTxSize: 0
  });

  useEffect(() => {
    // --- No changes needed inside useEffect ---
    if (transactions && transactions.length > 0) {
      // Calculate total stats
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

      // Process weekly data
      const now = new Date();
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      // Create daily buckets for the last 7 days
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

      // Fill the data
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
              // Assuming verify amount represents reward or some value
              days[dayIndex].verified += (tx.amount || 1); // Use amount if available, else count as 1
            }
          }
        }
      });

      setWeeklyData(days);
    }
  }, [transactions]); // Dependency array only needs transactions

  return (
    <div className="flex flex-col h-screen bg-gray-100"> {/* Use h-screen and bg-gray-100 for consistent look */}
      {/* Pass user name to Header if Header component supports it */}
      {/* <Header title="Analytics" showBack={true} userName={user?.name} /> */}
      <Header title="Analytics" showBack={true} />

      <div className="flex-1 overflow-y-auto pb-20"> {/* Add padding-bottom for nav */}
        <div className="p-4 md:p-6"> {/* Responsive padding */}

          {/* Personalized Subtitle - ADDED HERE */}
          {user && user.name && (
            <h3 className="text-md text-center text-gray-600 mb-4 md:text-lg">
              Activity Overview for <span className="font-semibold">{user.name}</span>
            </h3>
          )}
          {/* End of Added Subtitle */}

          {/* Activity Summary Card */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Activity Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Stat Item */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Total Sent</div>
                {/* Choose currency display - using selectedCurrency or default USD */}
                <div className="text-xl font-bold text-red-600">
                  ${stats.totalSent.toFixed(2)} {/* Assuming USD for now */}
                </div>
              </div>
              {/* Stat Item */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Total Received</div>
                <div className="text-xl font-bold text-green-600">
                  ${stats.totalReceived.toFixed(2)} {/* Assuming USD */}
                </div>
              </div>
              {/* Stat Item */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Verifications</div>
                <div className="text-xl font-bold text-blue-600">{stats.verifications}</div>
              </div>
              {/* Stat Item */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">Avg. Transaction</div>
                <div className="text-xl font-bold text-purple-600">
                  ${stats.avgTxSize.toFixed(2)} {/* Assuming USD */}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart Card */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Weekly Activity</h2>
            <div className="h-64"> {/* Ensure container has height */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }} // Adjust margins
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}
                    formatter={(value) => `$${value.toFixed(2)}`} // Format tooltip value
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="sent" fill="#EF4444" name="Sent ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" fill="#10B981" name="Received ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="verified" fill="#3B82F6" name="Verified (Reward/Count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction Insights Card */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Insights</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Network Contribution:</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${stats.verifications > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {stats.verifications > 0 ? 'Active Verifier' : 'User'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Transaction Volume (USD):</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${stats.totalSent + stats.totalReceived > 1000 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {stats.totalSent + stats.totalReceived > 1000 ? 'High' : (stats.totalSent + stats.totalReceived > 0 ? 'Moderate' : 'Low')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">MM Token Balance:</span>
                <span className="font-semibold text-indigo-600">
                  {balance.MM?.toFixed(2) || '0.00'} MM
                </span>
              </div>
               {/* Add more insights if needed */}
            </div>
          </div>

        </div>
      </div>

      <Navigation /> {/* Navigation at the bottom */}
    </div>
  );
};

export default Analytics;