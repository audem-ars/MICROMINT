import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import { ExternalLink } from 'lucide-react';

const AboutPage = () => {
  // Attempt to get version from environment variable, fallback to default
  const appVersion = process.env.REACT_APP_VERSION || '1.0.0';
  const buildDate = process.env.REACT_APP_BUILD_DATE || new Date().toLocaleDateString(); // Example build date

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header title="About Micro Mint" showBack={true} />
      <div className="flex-1 p-6 overflow-y-auto pb-20 space-y-5">

         <div className="text-center mb-6">
            {/* You can add a logo here */}
            {/* <img src="/logo.png" alt="Micro Mint Logo" className="mx-auto h-16 w-auto mb-4" /> */}
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Micro Mint</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Zero-Fee Peer-to-Peer Payments</p>
         </div>

         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
             <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Application Details</h2>
             <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-medium">{appVersion}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Build Date:</span>
                    <span className="font-medium">{buildDate}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Environment:</span>
                    <span className="font-medium">{process.env.NODE_ENV || 'development'}</span>
                </div>
             </div>
         </div>

         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
             <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Description</h2>
             <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Micro Mint is a lightweight, zero-fee payment network designed for fast and
                efficient micro-transactions. It utilizes a Directed Acyclic Graph (DAG)
                structure for transaction validation, relying on participants to verify
                previous transactions, eliminating the need for traditional mining fees
                and reducing confirmation times.
             </p>
         </div>

         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Legal & Resources</h2>
              <ul className="space-y-2 text-sm">
                 <li>
                     {/* Replace '#' with actual links */}
                     <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                         Terms of Service <ExternalLink size={14} className="ml-1 opacity-70" />
                     </a>
                 </li>
                 <li>
                     <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                         Privacy Policy <ExternalLink size={14} className="ml-1 opacity-70" />
                     </a>
                 </li>
                  <li>
                     <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                         Project Website/Docs <ExternalLink size={14} className="ml-1 opacity-70" />
                     </a>
                 </li>
              </ul>
         </div>

         <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-6">
            Copyright © {new Date().getFullYear()} Micro Mint Project. All rights reserved.
         </p>

      </div>
      <Navigation />
    </div>
  );
};
export default AboutPage;