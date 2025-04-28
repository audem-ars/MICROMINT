// src/components/TransactionGraph.js
import React, { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { useApp } from '../contexts/AppContext';

const TransactionGraph = () => {
  const { user, theme } = useApp(); // <-- Get theme from context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const networkContainer = useRef(null);
  const networkInstance = useRef(null);

  // --- Define graph options centrally ---
  const getGraphOptions = (isDarkMode) => ({
    nodes: {
      shape: 'dot',
      size: 16,
      font: {
        size: 12,
        // --- MODIFIED: Adjust font color for dark mode ---
        color: isDarkMode ? '#E5E7EB' : '#333' // gray-200 : gray-800
      },
      borderWidth: 2
    },
    edges: {
      width: 1,
      color: {
         // --- MODIFIED: Adjust edge color for dark mode ---
        color: isDarkMode ? '#4B5563' : '#ccc', // gray-600 : gray-300
        highlight: isDarkMode ? '#6B7280' : '#aaa' // gray-500 : gray-400
      },
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 }
      }
    },
    physics: {
      stabilization: {
        iterations: 100
      },
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 150,
        springConstant: 0.04
      }
    },
    groups: {
      // --- Colors defined here might override font color above ---
      // --- Consider adjusting these too if needed for dark mode ---
      pending: {
        color: { background: '#ffcc00', border: '#e6b800' } // Keep yellow or adjust
      },
      completed: {
        color: { background: '#66cc66', border: '#53a653' } // Keep green or adjust
      }
    }
  });

  useEffect(() => {
    let isMounted = true; // Track mount status

    const fetchGraphData = async () => {
      if (!user || !user.id || !networkContainer.current) return; // Ensure user and container exist

      setLoading(true);
      setError(null); // Clear previous errors

      // --- Destroy previous instance if exists ---
       if (networkInstance.current) {
           networkInstance.current.destroy();
           networkInstance.current = null;
       }

      try {
        // --- Replace with your actual API endpoint ---
        const response = await fetch(
           // Example endpoint - adjust as needed
           `/api/graph-data?walletId=${user.id}&limit=30` // Using a limit param example
        );

        if (!response.ok) {
           const errorData = await response.text(); // Get error text
           throw new Error(`Failed to fetch graph data: ${response.status} ${errorData}`);
        }

        const graphData = await response.json();

        if (!isMounted) return; // Don't proceed if unmounted

        // --- Determine if dark mode is active ---
        const isDarkMode = theme === 'dark'; // Get theme from context

        // Create the network visualization
        const container = networkContainer.current;

        // Configure the network with theme-aware options
        const options = getGraphOptions(isDarkMode);

        // Process nodes to add colors and groups
        const nodes = graphData.nodes.map(node => ({
          ...node,
          group: node.status === 'completed' ? 'completed' : 'pending',
          // Tooltip - might need styling if you customize it further
          title: `TX: ${node.id}<br>Status: ${node.status}<br>Time: ${new Date(node.timestamp).toLocaleString()}`
        }));

        // Create the network
        networkInstance.current = new Network(
          container,
          { nodes, edges: graphData.edges },
          options
        );

        // Add event listeners
        networkInstance.current.on('click', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            console.log('Clicked node:', nodeId); // Your log
            // Here you could show transaction details
          }
        });

      } catch (err) {
        console.error('Error fetching/rendering graph data:', err); // Your log
        if (isMounted) {
          setError(err.message);
        }
      } finally {
         if (isMounted) {
            setLoading(false);
         }
      }
    };

    fetchGraphData();

    return () => {
      isMounted = false; // Set unmounted status
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }
    };
  // --- MODIFIED: Re-run effect if user OR theme changes ---
  }, [user, theme]); // Dependency array includes user and theme

  return (
     // --- MODIFIED: Added dark background, text ---
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       {/* --- MODIFIED: Added dark text --- */}
      <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-100">Transaction Network</h2>

      {loading && (
        <div className="flex justify-center items-center h-64">
           {/* --- MODIFIED: Added dark border --- */}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      )}

      {error && (
         // Error text color likely fine
        <div className="text-red-500 text-center py-4">
          Error loading transaction graph: {error}
        </div>
      )}

      {/* --- MODIFIED: Added dark border --- */}
      <div
        ref={networkContainer}
        // Adjusted height and added background for visibility during loading/error
        className="h-96 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
        // Hide the container itself only if loading AND no error
        style={{ display: loading && !error ? 'none' : 'block' }}
      ></div>

       {/* --- MODIFIED: Added dark text --- */}
      <div className="mt-3 flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          {/* Keep specific legend colors unless you want them themed */}
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1 border border-gray-400 dark:border-gray-500"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1 border border-gray-400 dark:border-gray-500"></div>
          <span>Verified</span>
        </div>
        <div className="flex items-center">
           {/* --- MODIFIED: Legend line dark color --- */}
          <div className="w-6 border-t border-gray-400 dark:border-gray-500 mr-1 h-px"></div>
          <span>References</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionGraph;