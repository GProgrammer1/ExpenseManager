const express = require('express');
const categoryRouter = express.Router();
const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'

const firestore = admin.firestore();
const verifyUser = require('../middlewares/verifyUser');

// GetExpenseCategories
categoryRouter.get('/expense', async(req, res) => {
    try {
        const categoriesCollection = firestore.collection('expense-categories');
        const categoriesSnapshot = await categoriesCollection.get();
        let categories = categoriesSnapshot.docs.map(doc => doc.data());
        res.status(200).json(categories);
    } catch (ex) {
        console.error("🔥 Error fetching expense categories:", ex);
        res.status(500).json({ error: "Failed to fetch expense categories" });
    }
});

//GetIncomeCategories
categoryRouter.get('/income', async(req, res) => {
    try {
        const categoriesCollection = firestore.collection('income-categories');
        const categoriesSnapshot = await categoriesCollection.get();
        let categories = categoriesSnapshot.docs.map(doc => doc.data());
        res.status(200).json(categories);
    } catch (ex) {
        console.error("🔥 Error fetching income categories:", ex);
        res.status(500).json({ error: "Failed to fetch income categories" });
    }
});
// Export the router
module.exports = categoryRouter;