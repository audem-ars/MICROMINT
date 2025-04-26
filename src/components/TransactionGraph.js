// src/components/TransactionGraph.js
import React, { useEffect, useState, useRef } from 'react';
import { Network } from 'vis-network/standalone';
import { useApp } from '../contexts/AppContext';

const TransactionGraph = () => {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const networkContainer = useRef(null);
  const networkInstance = useRef(null);
  
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(
          `/api/getTransactionGraph?walletId=${user.id}&depth=20`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }
        
        const graphData = await response.json();
        
        // Create the network visualization
        const container = networkContainer.current;
        
        // Configure the network
        const options = {
          nodes: {
            shape: 'dot',
            size: 16,
            font: {
              size: 12,
              color: '#333'
            },
            borderWidth: 2
          },
          edges: {
            width: 1,
            color: {
              color: '#ccc',
              highlight: '#aaa'
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
            pending: {
              color: { background: '#ffcc00', border: '#e6b800' }
            },
            completed: {
              color: { background: '#66cc66', border: '#53a653' }
            }
          }
        };
        
        // Process nodes to add colors and groups
        const nodes = graphData.nodes.map(node => ({
          ...node,
          group: node.status === 'completed' ? 'completed' : 'pending',
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
            console.log('Clicked node:', nodeId);
            // Here you could show transaction details
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching graph data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (user && user.id) {
      fetchGraphData();
    }
    
    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }
    };
  }, [user]);
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-lg font-medium mb-3">Transaction Network</h2>
      
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-center py-4">
          Error loading transaction graph: {error}
        </div>
      )}
      
      <div 
        ref={networkContainer}
        className="h-80 border border-gray-200 rounded-lg"
        style={{ visibility: loading ? 'hidden' : 'visible' }}
      ></div>
      
      <div className="mt-3 flex justify-between text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Verified</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 border-t border-gray-400 w-6 mr-1"></div>
          <span>References</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionGraph;