/**
 * Web Worker for transaction verification
 * This simulates computational work with non-blocking progress updates.
 */

let verificationIntervalId = null;
let currentProgress = 0;
const totalDuration = 1500; // Target duration in milliseconds (e.g., 1.5 seconds)
const updateInterval = 50;  // Update progress every 50ms

// Simulate hash calculation (simplified - same as before)
function performHashCalculation(previousHash, transaction) {
  let result = '';
  const chars = 'abcdef0123456789';
  for (let i = 0; i < 64; i++) {
    const index = (previousHash.charCodeAt(i % previousHash.length) +
                  (transaction.amount || 0) * 1000 + i) % chars.length; // Added check for amount
    result += chars[Math.floor(index)];
  }
  return result;
}

// Function to start the simulated verification process
function startVerification(transaction) {
  console.log("[Worker] Starting verification for:", transaction.id);
  currentProgress = 0;
  let elapsedTime = 0;
  let hash = transaction.id || ''; // Start hash from ID
  let iterations = 0;
  const startTime = Date.now();

  // Clear any previous interval
  if (verificationIntervalId) {
    clearInterval(verificationIntervalId);
  }

  verificationIntervalId = setInterval(() => {
    elapsedTime += updateInterval;
    currentProgress = Math.min(100, (elapsedTime / totalDuration) * 100);

    // Perform a small chunk of work (doesn't need to be accurate, just simulates activity)
    for(let i = 0; i < 5000; i++) { // Adjust loop count to simulate load if needed
        hash = performHashCalculation(hash, transaction);
        iterations++;
    }


    // Send progress update
    self.postMessage({
      type: 'progress',
      progress: currentProgress
    });

    // Check if verification is complete
    if (currentProgress >= 100) {
      clearInterval(verificationIntervalId);
      verificationIntervalId = null;
      const endTime = Date.now();
      console.log("[Worker] Verification complete for:", transaction.id);

      // Send final result
      self.postMessage({
        type: 'result',
        verification: {
          transactionId: transaction.id,
          iterations: iterations, // More realistic iteration count
          timeElapsed: endTime - startTime, // Actual elapsed time
          result: 'verified',
          proofHash: hash // Final hash
        }
      });
    }
  }, updateInterval);
}

// Listen for messages from main thread
self.addEventListener('message', function(e) {
  const { command, transaction } = e.data;
  console.log("[Worker] Received command:", command, "Data:", transaction); // Log received message

  if (command === 'verify' && transaction) {
     // Basic check for needed transaction properties
     if (typeof transaction.id === 'undefined' || typeof transaction.amount === 'undefined') {
        console.error("[Worker] Invalid transaction data received:", transaction);
        // Optionally send an error back
        // self.postMessage({ type: 'error', message: 'Invalid transaction data received by worker.' });
        return;
     }
     startVerification(transaction);
  } else {
     console.warn("[Worker] Unknown command or missing transaction data:", e.data);
  }
});

console.log("[Worker] Verification worker script loaded and listening."); // Log on load