/**
 * A simplified client-side implementation of a DAG-based transaction system
 */

class MicroMintDAG {
    constructor() {
      // Initialize local storage if needed
      if (!localStorage.getItem('micromint_dag')) {
        localStorage.setItem('micromint_dag', JSON.stringify({
          transactions: {},
          tips: [], // Unconfirmed transactions
          balances: {},
          wallets: {},
          pendingVerifications: []
        }));
      }
      
      this.data = JSON.parse(localStorage.getItem('micromint_dag'));
      this.currentWalletId = null;
    }
    
    /**
     * Save current state to local storage
     */
    _saveState() {
      localStorage.setItem('micromint_dag', JSON.stringify(this.data));
    }
    
    /**
     * Create a new wallet
     */
    createWallet(name = 'Default Wallet') {
      // Generate wallet ID (simplified)
      const id = 'mm_' + Math.random().toString(36).substring(2, 15);
      
      this.data.wallets[id] = {
        id,
        name,
        created: new Date().toISOString(),
        privateKey: 'sk_' + Math.random().toString(36).substring(2, 30),
        publicKey: 'pk_' + Math.random().toString(36).substring(2, 30),
      };
      
      // Initialize balances
      this.data.balances[id] = {
        USD: 1000, // Starting balance for demo
        EUR: 750,  // Starting balance for demo
        MM: 100    // Starting MM tokens
      };
      
      this._saveState();
      this.currentWalletId = id;
      return id;
    }
    
    /**
     * Set active wallet
     */
    setCurrentWallet(walletId) {
      if (this.data.wallets[walletId]) {
        this.currentWalletId = walletId;
        return true;
      }
      return false;
    }
    
    /**
     * Get current wallet
     */
    getCurrentWallet() {
      if (!this.currentWalletId) {
        // If no wallet is set, create one
        this.createWallet();
      }
      
      return {
        ...this.data.wallets[this.currentWalletId],
        balances: this.data.balances[this.currentWalletId] || {}
      };
    }
    
    /**
     * Get random tips (unverified transactions) for verification
     */
    getPendingVerifications(count = 3) {
      // If we don't have enough tip transactions, generate some random ones
      if (this.data.tips.length < count) {
        this._generateRandomTransactions(10);
      }
      
      // Get random subset
      const pendingVerifications = [];
      const tips = [...this.data.tips];
      
      for (let i = 0; i < Math.min(count, tips.length); i++) {
        const randomIndex = Math.floor(Math.random() * tips.length);
        const tx = this.data.transactions[tips[randomIndex]];
        
        if (tx) {
          pendingVerifications.push({
            id: tx.id,
            amount: tx.amount,
            currency: tx.currency,
            sender: tx.senderWalletId.substring(0, 10),
            recipient: tx.recipientWalletId.substring(0, 10),
            date: this._formatRelativeTime(new Date(tx.timestamp)),
            reward: parseFloat((tx.amount * 0.001).toFixed(2)) // 0.1% of tx amount as reward
          });
        }
        
        // Remove this tip so we don't select it again
        tips.splice(randomIndex, 1);
      }
      
      return pendingVerifications;
    }
    
    /**
     * Create and sign a new transaction
     */
    createTransaction(amount, currency, recipientWalletId, note = '') {
      if (!this.currentWalletId) {
        throw new Error('No active wallet');
      }
      
      const senderWalletId = this.currentWalletId;
      const senderBalances = this.data.balances[senderWalletId];
      
      // Check balance
      if (!senderBalances || !senderBalances[currency] || senderBalances[currency] < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Generate transaction ID
      const txId = 'tx_' + Math.random().toString(36).substring(2, 15);
      
      // Create transaction
      const transaction = {
        id: txId,
        amount: parseFloat(amount),
        currency,
        senderWalletId,
        recipientWalletId,
        note,
        timestamp: new Date().toISOString(),
        references: [], // Will be filled with verified transactions
        signature: 'sig_' + Math.random().toString(36).substring(2, 30)
      };
      
      // Add to transactions and tips
      this.data.transactions[txId] = transaction;
      this.data.tips.push(txId);
      
      // Update balances
      this.data.balances[senderWalletId][currency] -= amount;
      
      // Initialize recipient balance if needed
      if (!this.data.balances[recipientWalletId]) {
        this.data.balances[recipientWalletId] = { USD: 0, EUR: 0, MM: 0 };
      }
      
      if (!this.data.balances[recipientWalletId][currency]) {
        this.data.balances[recipientWalletId][currency] = 0;
      }
      
      this.data.balances[recipientWalletId][currency] += amount;
      
      this._saveState();
      
      return transaction;
    }
    
    /**
     * Verify a transaction
     */
    verifyTransaction(txId) {
      if (!this.currentWalletId) {
        throw new Error('No active wallet');
      }
      
      // Get the transaction
      const transaction = this.data.transactions[txId];
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Calculate reward (0.1% of transaction value)
      const reward = parseFloat((transaction.amount * 0.001).toFixed(2));
      
      // Remove from tips
      this.data.tips = this.data.tips.filter(tip => tip !== txId);
      
      // Add verification reward to current wallet
      if (!this.data.balances[this.currentWalletId]['MM']) {
        this.data.balances[this.currentWalletId]['MM'] = 0;
      }
      
      this.data.balances[this.currentWalletId]['MM'] += reward;
      
      // Mark as verified (simplified)
      transaction.verifiedBy = this.currentWalletId;
      transaction.verifiedAt = new Date().toISOString();
      
      this._saveState();
      
      return reward;
    }
    
    /**
     * Get transaction history for current wallet
     */
    getTransactionHistory() {
      if (!this.currentWalletId) {
        return [];
      }
      
      const walletId = this.currentWalletId;
      const history = [];
      
      // Convert transactions object to array and filter for current wallet
      Object.values(this.data.transactions).forEach(tx => {
        if (tx.senderWalletId === walletId || tx.recipientWalletId === walletId) {
          history.push({
            id: tx.id,
            type: tx.senderWalletId === walletId ? 'send' : 'receive',
            amount: tx.amount,
            currency: tx.currency,
            recipient: tx.recipientWalletId === walletId ? undefined : tx.recipientWalletId.substring(0, 10),
            sender: tx.senderWalletId === walletId ? undefined : tx.senderWalletId.substring(0, 10),
            date: this._formatRelativeTime(new Date(tx.timestamp)),
            status: tx.verifiedBy ? 'completed' : 'pending'
          });
        }
        
        // Add verification rewards
        if (tx.verifiedBy === walletId) {
          history.push({
            id: tx.id + '_reward',
            type: 'verify',
            amount: parseFloat((tx.amount * 0.001).toFixed(2)),
            currency: 'MM',
            description: 'Verification reward',
            date: this._formatRelativeTime(new Date(tx.verifiedAt)),
            status: 'completed'
          });
        }
      });
      
      // Sort by date (newest first)
      return history.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    }
    
    /**
     * Generate some random transactions for testing/demo
     */
    _generateRandomTransactions(count = 5) {
      const currencies = ['USD', 'EUR', 'MM'];
      const senderIds = Object.keys(this.data.wallets);
      
      // If we don't have enough wallets, create some
      while (senderIds.length < 3) {
        const walletId = this.createWallet('Demo Wallet ' + (senderIds.length + 1));
        senderIds.push(walletId);
      }
      
      for (let i = 0; i < count; i++) {
        // Pick random sender and recipient
        const senderIndex = Math.floor(Math.random() * senderIds.length);
        let recipientIndex = Math.floor(Math.random() * senderIds.length);
        
        // Make sure sender and recipient are different
        while (recipientIndex === senderIndex) {
          recipientIndex = Math.floor(Math.random() * senderIds.length);
        }
        
        const senderWalletId = senderIds[senderIndex];
        const recipientWalletId = senderIds[recipientIndex];
        
        // Generate random amount and currency
        const amount = parseFloat((Math.random() * 100 + 1).toFixed(2));
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        
        // Generate transaction ID
        const txId = 'tx_' + Math.random().toString(36).substring(2, 15);
        
        // Random time in the last 24 hours
        const timestamp = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString();
        
        // Create transaction
        const transaction = {
          id: txId,
          amount,
          currency,
          senderWalletId,
          recipientWalletId,
          note: '',
          timestamp,
          references: [],
          signature: 'sig_' + Math.random().toString(36).substring(2, 30)
        };
        
        // Add to transactions and tips
        this.data.transactions[txId] = transaction;
        this.data.tips.push(txId);
        
        // Ensure balances exist
        if (!this.data.balances[senderWalletId]) {
          this.data.balances[senderWalletId] = { USD: 1000, EUR: 750, MM: 100 };
        }
        
        if (!this.data.balances[recipientWalletId]) {
          this.data.balances[recipientWalletId] = { USD: 1000, EUR: 750, MM: 100 };
        }
      }
      
      this._saveState();
    }
    
    /**
     * Format timestamp to relative time string
     */
    _formatRelativeTime(date) {
      const now = new Date();
      const diffMs = now - date;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return `${diffDays}d ago`;
      }
    }
  }
  
  // Create singleton instance
  const dagService = new MicroMintDAG();
  export default dagService;