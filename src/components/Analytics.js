// src/components/Analytics.js
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header';
import Navigation from './Navigation';

const Analytics = () => {
  const { transactions, balance, user } = useApp();
  const [weeklyData, setWeeklyData] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    verifications: 0,
    avgTxSize: 0
  });
  
  useEffect(() => {
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
              days[dayIndex].verified += tx.amount;
            }
          }
        }
      });
      
      setWeeklyData(days);
    }
  }, [transactions]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-white overflow-auto">
        <div className="p-6">
          <Header title="Analytics" showBack={true} />
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-medium mb-3">Activity Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-500 text-sm">Total Sent</div>
                <div className="text-xl font-bold">${stats.totalSent.toFixed(2)}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-500 text-sm">Total Received</div>
                <div className="text-xl font-bold">${stats.totalReceived.toFixed(2)}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-500 text-sm">Verifications</div>
                <div className="text-xl font-bold">{stats.verifications}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-gray-500 text-sm">Avg. Transaction</div>
                <div className="text-xl font-bold">${stats.avgTxSize.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Weekly Activity</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" fill="#ff8c66" name="Sent" />
                  <Bar dataKey="received" fill="#82ca9d" name="Received" />
                  <Bar dataKey="verified" fill="#8884d8" name="Verified" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Transaction Insights</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Network Contribution:</span>
                <span className="font-medium">
                  {stats.verifications > 0 ? 'Active Verifier' : 'New User'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction Volume:</span>
                <span className="font-medium">
                  {stats.totalSent + stats.totalReceived > 1000 ? 'High' : 'Low'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">MM Token Balance:</span>
                <span className="font-medium">{balance.MM?.toFixed(2) || '0.00'} MM</span>
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