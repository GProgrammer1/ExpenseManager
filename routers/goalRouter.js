const express = require('express');
const goalsRouter = express.Router();
const {admin} = require('../admin'); 

const firestore = admin.firestore();
goalsRouter.post('/addGoal',  async (req, res) => {
  try {
    const { userId, ...goalData } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const goalsCollection = firestore.collection('goals');
    const goalRef = goalsCollection.doc();
    console.log("GFoal ref id",goalRef.id);
    
    const goal = { ...goalData , id: goalRef.id, userId,
      deadline: {
        seconds: goalData.deadline.seconds,
        nanoseconds: goalData.deadline.nanoseconds
      }
    };

    const batch = firestore.batch();
    batch.set(goalRef, goal);

    const userRef = firestore.collection('users').doc(userId);
    batch.update(userRef, { goals: admin.firestore.FieldValue.arrayUnion(goalRef) });

    await batch.commit();
    res.status(201).json({ message: 'Goal added successfully', goal });
  } catch (ex) {
    console.error("🔥 Error adding goal:", ex);
    res.status(500).json({ error: "Failed to add goal" });
  }
});

goalsRouter.get('/:userId',  async (req, res) => {
  try {
    const { userId } = req.params;
    const goalsCollection = firestore.collection('goals');
    const goalsQuery = await goalsCollection.where('userId', '==', userId).get();
    const goals = goalsQuery.docs.map(doc => doc.data());

    res.status(200).json(goals);
  } catch (ex) {
    console.error("🔥 Error getting goals:", ex);
    res.status(500).json({ error: "Failed to retrieve goals" });
  }
});

goalsRouter.delete('/:goalId',  async (req, res) => {
  try {
    const { goalId } = req.params;
    const goalRef = firestore.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const { userId } = goalDoc.data();
    const batch = firestore.batch();
    batch.delete(goalRef);

    const userRef = firestore.collection('users').doc(userId);
    batch.update(userRef, { goals: admin.firestore.FieldValue.arrayRemove(goalRef) });

    await batch.commit();
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (ex) {
    console.error("🔥 Error deleting goal:", ex);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

goalsRouter.put('/:goalId',  async (req, res) => {
  try {
    const { goalId } = req.params;
    const goalRef = firestore.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await goalRef.update(req.body);
    res.status(200).json({ message: "Goal updated successfully" });
  } catch (ex) {
    console.error("🔥 Error updating goal:", ex);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

module.exports = goalsRouter;
