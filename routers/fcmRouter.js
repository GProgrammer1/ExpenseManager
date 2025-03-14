const express = require('express');
const fcmRouter = express.Router();
const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'

const firestore = admin.firestore();
const verifyUser = require('../middlewares/verifyUser');
// Check if FCM token exists
fcmRouter.get('/exists/:uid/:token',verifyUser,  async (req, res) => {
  try {
    const { uid, token } = req.params;
    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.where('uid', '==', uid).get();

    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      if (userData.fcmTokens && userData.fcmTokens.includes(token)) {
        return res.status(200).json({ exists: true });
      }
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    console.error("🔥 Error checking FCM token existence:", error);
    res.status(500).json({ error: "Failed to check token existence" });
  }
});

// Add FCM token
fcmRouter.post('/add',verifyUser,  async (req, res) => {
  try {
    const { uid, fcmToken } = req.body;
    if (!uid || !fcmToken) return res.status(400).json({ error: "UID and FCM token are required" });

    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.where('uid', '==', uid).get();

    for (const doc of querySnapshot.docs) {
      const userRef = doc.ref;
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(fcmToken)
      });

      return res.status(200).json({ message: "Token added successfully" });
    }

    res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("🔥 Error adding FCM token:", error);
    res.status(500).json({ error: "Failed to add token" });
  }
});

// Remove FCM token
fcmRouter.delete('/remove/:uid/:fcmToken', verifyUser,async (req, res) => {
  try {
    const { uid, fcmToken } = req.params;
    if (!uid || !fcmToken) return res.status(400).json({ error: "UID and FCM token are required" });

    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.where('uid', '==', uid).get();

    for (const doc of querySnapshot.docs) {
      const userRef = doc.ref;
      await userRef.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(fcmToken)
      });

      return res.status(200).json({ message: "Token removed successfully" });
    }

    res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("🔥 Error removing FCM token:", error);
    res.status(500).json({ error: "Failed to remove token" });
  }
});

module.exports = fcmRouter;
