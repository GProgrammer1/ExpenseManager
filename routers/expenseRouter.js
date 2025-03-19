const express = require('express');
const expenseRouter = express.Router();
const {admin} = require('../admin');

const firestore = admin.firestore();
expenseRouter.post('/addExpense', async (req, res) => {
    try {
        const { userId, ...expenseData } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID is required" });
        const userDocRef = firestore.doc(`users/${userId}`);
        const expensesCollection = firestore.collection('expenses');
        const expenseDocRef = expensesCollection.doc();
        const expense = {...expenseData, id: expenseDocRef.id, userId: userId, 
            date: {
                seconds: expenseData.date.seconds,
                nanoseconds: expenseData.date.nanoseconds
            }
         };

        const batch = firestore.batch();
        batch.set(expenseDocRef, expense);
        batch.update(userDocRef, { expenses: admin.firestore.FieldValue.arrayUnion(expenseDocRef) });
        await batch.commit();
        res.status(201).json({ message: 'Expense added successfully', expense });
    } catch (ex) {
        console.error("Error adding expense:", ex);
        res.status(500).json({ error: "Failed to add expense" });
    }
});

expenseRouter.get('/all/:uid',  async (req, res) => {
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
                date: {
                    seconds: expense.date.seconds,  
                    nanoseconds: expense.date.nanoseconds
                }
            };
        });

        res.status(200).json(expenses);
    } catch (ex) {
        console.error("Error fetching expenses:", ex);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
}
);

expenseRouter.delete('/:expenseId',  async (req, res) => {
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
        batch.update(userRef, { expenses: admin.firestore.FieldValue.arrayRemove(expenseRef) });
        await batch.commit();
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (ex) {
        console.error(" Error deleting expense:", ex);
        res.status(500).json({ error: "Failed to delete expense" });
    }
});

expenseRouter.get('/expenseData/:uid/:month',  async (req, res) => {
    try {
        const { uid, month } = req.params;
        const expensesCollection = firestore.collection('expenses');
        const q = expensesCollection.where('userId', '==', uid);
        const expensesSnapshot = await q.get();
        const monthNum = parseInt(month);

        const expenses = expensesSnapshot.docs
            .map(doc => doc.data())
            .filter(expense => {
                const timestamp = new Date(expense.date.seconds * 1000);
                return timestamp.getMonth() + 1 === monthNum;
                });

        if (expenses.length === 0) {
            return res.status(200).json({});
        }
       
        res.status(200).json(expenses);
    } catch (ex) {
        console.error("🔥 Error fetching expense data:", ex);
        res.status(500).json({ error: "Failed to fetch expense data" });
    }
});

expenseRouter.get('/:uid/:month', async (req, res) => {
    try {
        const { uid, month } = req.params;
        const expensesCollection = firestore.collection('expenses');
        const q = expensesCollection.where('userId', '==', uid);
        const expensesSnapshot = await q.get();
        const monthNum = parseInt(month);
        const expenses = expensesSnapshot.docs
            .map(doc => doc.data())
            .filter(expense => {
                const timestamp = new Date(expense.date.seconds * 1000);
            
                return timestamp.getMonth() === monthNum ;
               });
        res.status(200).json(expenses);
    } catch (ex) {
        console.error(" Error fetching expenses:", ex);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

module.exports = expenseRouter;
