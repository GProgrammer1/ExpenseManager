const express = require('express');
const subscriptionsRouter = express.Router();
const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'
const firestore = admin.firestore();
const verifyUser = require('../middlewares/verifyUser');
/**
 * POST /subscriptions/addSubscription
 * Adds a new subscription and updates the corresponding user document.
 */
subscriptionsRouter.post('/addSubscription', verifyUser, async (req, res) => {
  try {
    const { userId, ...subscriptionData } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // Create a reference for the new subscription document
    const subscriptionRef = firestore.collection('subscriptions').doc();
    const subscription = { 
      ...subscriptionData, 
      id: subscriptionRef.id, 
      userId 
    };

    // Initialize Firestore batch for atomic operations
    const batch = firestore.batch();

    // Set the subscription document
    batch.set(subscriptionRef, subscription);

    // Get the user document reference
    const userRef = firestore.collection('users').doc(userId);

    // Add the subscription reference to the user's Subscriptions array field
    batch.update(userRef, {
      Subscriptions: admin.firestore.FieldValue.arrayUnion(subscriptionRef) // Use subscriptionRef directly
    });

    // Commit the batch operations
    await batch.commit();

    // Send the success response with the subscription data
    res.status(201).json({ message: 'Subscription added successfully', subscription });
  } catch (ex) {
    console.error("🔥 Error adding subscription:", ex);
    res.status(500).json({ error: "Failed to add subscription" });
  }
});


/**
 * GET /subscriptions/:userId
 * Retrieves all subscriptions for the given user.
 */
subscriptionsRouter.get('/:userId', verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const subscriptionsSnapshot = await firestore.collection('subscriptions').where('userId', '==', userId).get();
    const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());

    res.status(200).json(subscriptions);
  } catch (ex) {
    console.error("🔥 Error getting subscriptions:", ex);
    res.status(500).json({ error: "Failed to retrieve subscriptions" });
  }
});

/**
 * DELETE /subscriptions/:subscriptionId
 * Deletes a subscription by its ID and updates the corresponding user document.
 */
subscriptionsRouter.delete('/:subscriptionId', verifyUser, async (req, res) => {
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

/**
 * PUT /subscriptions/:subscriptionId
 * Updates a subscription document with the provided data.
 */
subscriptionsRouter.put('/:subscriptionId', verifyUser, async (req, res) => {
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
