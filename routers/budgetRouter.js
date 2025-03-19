const express = require('express');
const budgetRouter = express.Router();
const {admin} = require('../admin');

const firestore = admin.firestore();

budgetRouter.get('/current/:uid/:month', async (req, res) => {
  try {
    const { uid, month } = req.params;
    const monthNum = parseInt(month);
    
    const expensesCollection = firestore.collection('expenses');
    const expensesQuery = expensesCollection.where('userId', '==', uid);
    const expensesSnapshot = await expensesQuery.get();
    
    let budget = { month: monthNum, totalBudget: 0, spendings: {}, userId: uid, id: '' };
    let totalExpenses = 0;
    
    expensesSnapshot.docs.forEach(docSnapshot => {
      const expenseData = docSnapshot.data();
      const date = new Date(expenseData.date.seconds * 1000);
      if (date.getMonth() + 1 === monthNum) {
        totalExpenses += expenseData.amount;
        if (budget.spendings[expenseData.category]) {
          budget.spendings[expenseData.category] += expenseData.amount;
        } else {
          budget.spendings[expenseData.category] = expenseData.amount;
        }
      }
    });
    
    budget.totalBudget = totalExpenses;
    if (Object.keys(budget.spendings).length === 0) {
      return res.status(200).json(null);
    }
    
    res.status(200).json(budget);
  } catch (err) {
    console.error("Error fetching current spendings:", err);
    res.status(500).json({ error: "Failed to fetch current spendings" });
  }
});

budgetRouter.get('/user/:uid/:month',  async (req, res) => {
  try {
    const { uid, month } = req.params;
    const budgetRef = firestore.doc(`budgets/${uid}_${month}`);
    const budgetDoc = await budgetRef.get();
    
    if (budgetDoc.exists) {
      res.status(200).json( budgetDoc.data());
    } else {
      res.status(404).json({ error: "Budget not found" });
    }
  } catch (err) {
    console.error("Error fetching user budget:", err);
    res.status(500).json({ error: "Failed to fetch user budget" });
  }
});

budgetRouter.get('/all/:uid',  async (req, res) => {

  try {
    const { uid } = req.params;
    const budgetsCollection = firestore.collection('budgets');
    const budgetsQuery = budgetsCollection.where('userId', '==', uid);
    const querySnapshot = await budgetsQuery.get();
    let budgets = querySnapshot.docs.map(doc => doc.data());
    res.status(200).json(budgets);
  }
  catch (err) {
    console.error("Error fetching all budgets:", err);
    res.status(500).json({ error: "Failed to fetch all budgets" });
  }
});


budgetRouter.get('/total/:uid/:month',  async (req, res) => {
  try {
    const { uid, month } = req.params;
    const monthNum = parseInt(month);
    const incomeQuery = firestore.collection('incomes').where('userId', '==', uid);
    const expensesQuery = firestore.collection('expenses').where('userId', '==', uid);
    const [incomesSnapshot, expensesSnapshot] = await Promise.all([
      incomeQuery.get(),
      expensesQuery.get()
    ]);
    
    let totalIncome = incomesSnapshot.docs.reduce((sum, docSnapshot) => {
      const incomeData = docSnapshot.data();
      return incomeData.date.toDate().getMonth() + 1 === monthNum ? sum + incomeData.amount : sum;
    }, 0);
    
    let totalExpense = expensesSnapshot.docs.reduce((sum, docSnapshot) => {
      const expenseData = docSnapshot.data();
      return expenseData.date.toDate().getMonth() + 1 === monthNum ? sum + expenseData.amount : sum;
    }, 0);
    
    res.status(200).json([ 
      { type: 'Expense', amount: totalExpense },
      { type: 'Income', amount: totalIncome }
    ]);
  } catch (err) {
    console.error("Error fetching total budget:", err);
    res.status(500).json({ error: "Failed to fetch total budget" });
  }
});


budgetRouter.post('/add/:uid',  async (req, res) => {
  try {
    const { uid } = req.params;
    const budget = req.body; 
    const userDocRef = firestore.doc(`users/${uid}`);
    const budgetRef = firestore.doc(`budgets/${uid}_${budget.month}`);
    const batch = firestore.batch();
    
    console.log("Budget:", budget);
    
    const budgetDoc = await budgetRef.get();
    budget.id = budgetRef.id;
    if (budgetDoc.exists) {
      batch.update(budgetRef, { spendings: budget.spendings, totalBudget: budget.totalBudget });
    } else {
      batch.set(budgetRef, budget);
      batch.update(userDocRef, { budgets: admin.firestore.FieldValue.arrayUnion(budgetRef) });
    }
    
    await batch.commit();
    res.status(200).json({ message: "Budget added/updated successfully", budget });
  } catch (err) {
    console.error("Error adding budget:", err);
    res.status(500).json({ error: "Failed to add budget" });
  }
});

module.exports = budgetRouter;
