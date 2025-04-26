// api/updateSecuritySettings.js
const { MongoClient } = require('mongodb');
const { authenticateUser } = require('./middleware/auth');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'micromint';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  // Authenticate user
  const auth = await authenticateUser(req);
  if (!auth.authenticated) {
    return res.status(401).json({ error: auth.error });
  }
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const { 
      dailyLimit, 
      requireConfirmationAbove,
      twoFactorEnabled,
      currentPassword,
      newPassword
    } = req.body;
    
    // Update security settings
    const updateData = {};
    
    if (dailyLimit !== undefined) {
      updateData['securitySettings.dailyLimit'] = parseFloat(dailyLimit);
    }
    
    if (requireConfirmationAbove !== undefined) {
      updateData['securitySettings.requireConfirmationAbove'] = parseFloat(requireConfirmationAbove);
    }
    
    if (twoFactorEnabled !== undefined) {
      updateData['securitySettings.twoFactorEnabled'] = twoFactorEnabled;
    }
    
    // If updating password
    if (newPassword && currentPassword) {
      // Verify current password
      const user = await db.collection('users').findOne({
        _id: new ObjectId(auth.user.userId)
      });
      
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }
    
    // Update user
    if (Object.keys(updateData).length > 0) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(auth.user.userId) },
        { $set: updateData }
      );
    }
    
    return res.status(200).json({
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
};