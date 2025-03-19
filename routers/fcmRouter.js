const express = require('express');
const fcmRouter = express.Router();
const {admin} = require('../admin'); 

const firestore = admin.firestore();
fcmRouter.get('/exists/:uid/:token',  async (req, res) => {
  try {
    const { uid, token } = req.params;
    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.where('uid', '==', uid).get();

    for (const doc of querySnapshot.docs) {
      const userData = doc.data();
      if (userData.fcmTokens && userData.fcmTokens.includes(token)) {
        return res.status(200).json(true);
      }
    }

    res.status(200).json(false);
  } catch (error) {
    console.error("🔥 Error checking FCM token existence:", error);
    res.status(500).json({ error: "Failed to check token existence" });
  }
});

fcmRouter.post('/add',  async (req, res) => {
  try {
    const { uid, fcmToken } = req.body;
    if (!uid || !fcmToken) return res.status(400).json({ error: "UID and FCM token are required" });

    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.where('id', '==', uid).get();

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
fcmRouter.delete('/remove/:uid/:fcmToken', async (req, res) => {
  try {
    const { uid, fcmToken } = req.params;
    console.log("UID of remove token: ", uid);
    console.log("FCM Token: ", fcmToken);
    
    if (!uid || !fcmToken) return res.status(400).json({ error: "UID and FCM token are required" });

    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.where('id', '==', uid).get();

    for (const doc of querySnapshot.docs) {
      console.log("DOC: ", doc.data());
      
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
