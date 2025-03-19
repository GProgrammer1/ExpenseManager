const express = require('express');
const subscriptionsRouter = express.Router();
const {admin} = require('../admin'); 
const firestore = admin.firestore();

subscriptionsRouter.post('/addSubscription',  async (req, res) => {
  try {
    const { userId, ...subscriptionData } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const subscriptionRef = firestore.collection('subscriptions').doc();
    const subscription = { 
      ...subscriptionData, 
      id: subscriptionRef.id, 
      userId 
    };

    const batch = firestore.batch();

    batch.set(subscriptionRef, subscription);

    const userRef = firestore.collection('users').doc(userId);

    batch.update(userRef, {
      subscriptions: admin.firestore.FieldValue.arrayUnion(subscriptionRef) 
    });

    await batch.commit();

    res.status(201).json({ message: 'Subscription added successfully', subscription });
  } catch (ex) {
    console.error(" Error adding subscription:", ex);
    res.status(500).json({ error: "Failed to add subscription" });
  }
});

subscriptionsRouter.get('/:userId',  async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptionsSnapshot = await firestore.collection('subscriptions').where('userId', '==', userId).get();
    const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());

    res.status(200).json(subscriptions);
  } catch (ex) {
    console.error("Error getting subscriptions:", ex);
    res.status(500).json({ error: "Failed to retrieve subscriptions" });
  }
});

subscriptionsRouter.delete('/:subscriptionId',  async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionRef = firestore.collection('subscriptions').doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const { userId } = subscriptionDoc.data();
    const batch = firestore.batch();
    batch.delete(subscriptionRef);

    const userRef = firestore.collection('users').doc(userId);
    batch.update(userRef, { subscriptions: admin.firestore.FieldValue.arrayRemove(subscriptionId) });

    await batch.commit();
    res.status(200).json({ message: "Subscription deleted successfully" });
  } catch (ex) {
    console.error("🔥 Error deleting subscription:", ex);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});


subscriptionsRouter.put('/:subscriptionId',  async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionRef = firestore.collection('subscriptions').doc(subscriptionId);
    const subscriptionDoc = await subscriptionRef.get();

    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    await subscriptionRef.update(req.body);
    res.status(200).json({ message: "Subscription updated successfully" });
  } catch (ex) {
    console.error("🔥 Error updating subscription:", ex);
    res.status(500).json({ error: "Failed to update subscription" });
  }
});

module.exports = subscriptionsRouter;
