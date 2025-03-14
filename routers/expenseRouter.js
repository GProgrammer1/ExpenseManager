const express = require('express');
const expenseRouter = express.Router();
const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'

const firestore = admin.firestore();
const verifyUser = require('../middlewares/verifyUser');
const e = require('express');
// Add Expense
expenseRouter.post('/addExpense', verifyUser,async (req, res) => {
    try {
        const { userId, ...expenseData } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID is required" });
        const userDocRef = firestore.doc(`users/${userId}`);
        const expensesCollection = firestore.collection('expenses');
        const expenseDocRef = expensesCollection.doc();
        const expense = {...expenseData, id: expenseDocRef.id, userId: userId, 
            Date: {
                seconds: expenseData.Date.seconds,
                nanoseconds: expenseData.Date.nanoseconds
            }
         };

        const batch = firestore.batch();
        batch.set(expenseDocRef, expense);
        batch.update(userDocRef, { Expenses: admin.firestore.FieldValue.arrayUnion(expenseDocRef) });
        await batch.commit();
        res.status(201).json({ message: 'Expense added successfully', expense });
    } catch (ex) {
        console.error("🔥 Error adding expense:", ex);
        res.status(500).json({ error: "Failed to add expense" });
    }
});

expenseRouter.get('/all/:uid', verifyUser, async (req, res) => {
    try {
        const expensesCollection = firestore.collection('expenses');
        const { uid } = req.params;
        const q = expensesCollection.where('userId', '==', uid);

        const expensesSnapshot = await q.get();
        let expenses = expensesSnapshot.docs.map(doc => doc.data());
        console.log(expenses);
        expenses = expenses.map(expense => {
            return {
                ...expense,
                Date: {
                    seconds: expense.Date.seconds,  
                    nanoseconds: expense.Date.nanoseconds
                }
            };
        });

        res.status(200).json(expenses);
    } catch (ex) {
        console.error("🔥 Error fetching expenses:", ex);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
}
);

// Delete Expense
expenseRouter.delete('/:expenseId',verifyUser,  async (req, res) => {
    try {
        const { expenseId } = req.params;
        const expenseRef = firestore.doc(`expenses/${expenseId}`);
        const expenseDoc = await expenseRef.get();

        if (!expenseDoc.exists) {
            return res.status(404).json({ error: "Expense not found" });
        }

        const { userId } = expenseDoc.data();
        const userRef = firestore.doc(`users/${userId}`);
        const batch = firestore.batch();
        batch.delete(expenseRef);
        batch.update(userRef, { Expenses: admin.firestore.FieldValue.arrayRemove(expenseRef) });
        await batch.commit();
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (ex) {
        console.error("🔥 Error deleting expense:", ex);
        res.status(500).json({ error: "Failed to delete expense" });
    }
});

// Get Expense Data (grouped by category) for a given month
expenseRouter.get('/expenseData/:uid/:month', verifyUser, async (req, res) => {
    try {
        const { uid, month } = req.params;
        const expensesCollection = firestore.collection('expenses');
        const q = expensesCollection.where('userId', '==', uid);
        const expensesSnapshot = await q.get();
        const monthNum = parseInt(month);

        // Filter expenses for the specified month
        const expenses = expensesSnapshot.docs
            .map(doc => doc.data())
            .filter(expense => {
                const timestamp = new Date(expense.Date.seconds * 1000);
                return timestamp.getMonth() + 1 === monthNum;
                });

        if (expenses.length === 0) {
            return res.status(200).json({});
        }

        // Group expenses by category
       
        res.status(200).json(expenses);
    } catch (ex) {
        console.error("🔥 Error fetching expense data:", ex);
        res.status(500).json({ error: "Failed to fetch expense data" });
    }
});

// Get All Expenses for a user in a given month
expenseRouter.get('/:uid/:month', verifyUser,async (req, res) => {
    try {
        const { uid, month } = req.params;
        const expensesCollection = firestore.collection('expenses');
        const q = expensesCollection.where('userId', '==', uid);
        const expensesSnapshot = await q.get();
        const monthNum = parseInt(month);
        const expenses = expensesSnapshot.docs
            .map(doc => doc.data())
            .filter(expense => {
                const timestamp = new Date(expense.Date.seconds * 1000);
                // console.log("Expense month:" ,timestamp.getMonth() );
                // console.log("Month:", monthNum );
                
                return timestamp.getMonth() === monthNum ;
               });
        res.status(200).json(expenses);
    } catch (ex) {
        console.error("🔥 Error fetching expenses:", ex);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

module.exports = expenseRouter;
