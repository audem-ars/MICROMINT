import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

const AboutPage = () => {
  // Get app version from package.json or define here
  const appVersion = process.env.REACT_APP_VERSION || '1.0.0'; // Example

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header title="About Micro Mint" showBack={true} />
      <div className="flex-1 p-6 overflow-y-auto pb-20 space-y-4">
         <h1 className="text-xl font-semibold">Micro Mint</h1>
         <p className="text-sm text-gray-700">
            Version: {appVersion}
         </p>
         <p className="text-sm text-gray-700">
            Micro Mint is a zero-fee payment network leveraging a DAG structure
            and community verification.
         </p>
         <p className="text-sm text-gray-700">
            Copyright © {new Date().getFullYear()} Your Name/Company
         </p>
         {/* Add links to terms, privacy policy etc. */}
      </div>
      <Navigation />
    </div>
  );
};
export default AboutPage;