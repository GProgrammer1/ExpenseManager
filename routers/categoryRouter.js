const express = require('express');
const categoryRouter = express.Router();
const {admin} = require('../admin'); 
const firestore = admin.firestore();

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
module.exports = categoryRouter;