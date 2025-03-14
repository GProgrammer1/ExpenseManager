const express = require('express');
const budgetRouter = express.Router();
const {admin} = require('../admin'); // Ensure Firebase Admin SDK is initialized in 'admin.js'

const firestore = admin.firestore();
const verifyUser = require('../middlewares/verifyUser');
/**
 * GET /budget/current/:uid/:month
 * Calculate current spendings for a given month by aggregating expenses.
 */
budgetRouter.get('/current/:uid/:month', verifyUser,async (req, res) => {
  try {
    const { uid, month } = req.params;
    const monthNum = parseInt(month);
    
    // Query expenses for the given user
    const expensesCollection = firestore.collection('expenses');
    const expensesQuery = expensesCollection.where('userId', '==', uid);
    const expensesSnapshot = await expensesQuery.get();
    
    // Calculate budget from expenses
    let budget = { month: monthNum, totalBudget: 0, spendings: {}, userId: uid, id: '' };
    let totalExpenses = 0;
    
    expensesSnapshot.docs.forEach(docSnapshot => {
      const expenseData = docSnapshot.data();
      const date = new Date(expenseData.Date.seconds * 1000);
      // Firestore Date objects: getMonth() returns 0-indexed; add 1 to compare with monthNum
      if (date.getMonth() + 1 === monthNum) {
        totalExpenses += expenseData.Amount;
        if (budget.spendings[expenseData.Category]) {
          budget.spendings[expenseData.Category] += expenseData.Amount;
        } else {
          budget.spendings[expenseData.Category] = expenseData.Amount;
        }
      }
    });
    
    budget.totalBudget = totalExpenses;
    // If no spendings, return null
    if (Object.keys(budget.spendings).length === 0) {
      return res.status(200).json(null);
    }
    
    res.status(200).json(budget);
  } catch (err) {
    console.error("Error fetching current spendings:", err);
    res.status(500).json({ error: "Failed to fetch current spendings" });
  }
});

/**
 * GET /budget/user/:uid/:month
 * Retrieve the stored budget document for a user for a specific month.
 */
budgetRouter.get('/user/:uid/:month', verifyUser, async (req, res) => {
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

budgetRouter.get('/all/:uid',verifyUser,  async (req, res) => {

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

/**
 * GET /budget/total/:uid/:month
 * Calculate total income and expenses for a given month.
 */
budgetRouter.get('/total/:uid/:month',verifyUser,  async (req, res) => {
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
      return incomeData.Date.toDate().getMonth() + 1 === monthNum ? sum + incomeData.Amount : sum;
    }, 0);
    
    let totalExpense = expensesSnapshot.docs.reduce((sum, docSnapshot) => {
      const expenseData = docSnapshot.data();
      return expenseData.Date.toDate().getMonth() + 1 === monthNum ? sum + expenseData.Amount : sum;
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

/**
 * POST /budget/add/:uid
 * Add or update a budget for a user for a specific month.
 */
budgetRouter.post('/add/:uid',verifyUser,  async (req, res) => {
  try {
    const { uid } = req.params;
    const budget = req.body; // Expecting a budget object with at least a 'month' property.
    const userDocRef = firestore.doc(`users/${uid}`);
    const budgetRef = firestore.doc(`budgets/${uid}_${budget.month}`);
    const batch = firestore.batch();
    
    console.log("Budget:", budget);
    
    // Check if budget document already exists
    const budgetDoc = await budgetRef.get();
    budget.id = budgetRef.id;
    if (budgetDoc.exists) {
      batch.update(budgetRef, { spendings: budget.spendings, totalBudget: budget.totalBudget });
    } else {
      batch.set(budgetRef, budget);
      batch.update(userDocRef, { Budgets: admin.firestore.FieldValue.arrayUnion(budget) });
    }
    
    await batch.commit();
    res.status(200).json({ message: "Budget added/updated successfully", budget });
  } catch (err) {
    console.error("Error adding budget:", err);
    res.status(500).json({ error: "Failed to add budget" });
  }
});

module.exports = budgetRouter;
