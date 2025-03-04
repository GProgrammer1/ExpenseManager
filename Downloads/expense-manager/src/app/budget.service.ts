import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Budget, Expense, Income, User } from './models';
import { addDoc, collection, doc, getDocs, updateDoc, writeBatch, query, where, getDoc, DocumentReference, arrayUnion } from 'firebase/firestore';
import { firestore } from 'firebase.config';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  budgetSubject = new BehaviorSubject<{ month: number, budget: Budget } | null>(null);
  budget$ = this.budgetSubject.asObservable();

  totalAmountSubject = new BehaviorSubject<number>(0);
  totalAmount$ = this.totalAmountSubject.asObservable();

  initialValues = [
    {month: 1, budget: null}, 
    {month: 2, budget: null},
    {month: 3, budget: null},
    {month: 4, budget: null},
    {month: 5, budget: null},
    {month: 6, budget: null},
    {month: 7, budget: null},
    {month: 8, budget: null},
    {month: 9, budget: null},
    {month: 10, budget: null},
    {month: 11, budget: null},
    {month: 12, budget: null}
    ]
  changedBudgetSubject = new BehaviorSubject<'Expense' | 'Income' | null>(null);
  changedBudget$ = this.changedBudgetSubject.asObservable();

  cachedBudgetSubject = new BehaviorSubject<{ month: number, budget: Budget }[]>([]);

  currentBudgetSubject = new BehaviorSubject<{month: number, budget: Budget| null}[]>(
    this.initialValues
  );
  currentBudget$ = this.currentBudgetSubject.asObservable();

  constructor() {}

  signalChange(type: 'Expense' | 'Income') {
    this.changedBudgetSubject.next(type);
  }

  async getCurrentSpendings(month: number, uid: string): Promise<Budget | null> {
    try {
      const expensesCollection = collection(firestore, 'expenses');
      const expensesQuery = query(expensesCollection, where('userId', '==', uid));
      const expensesSnapshot = await getDocs(expensesQuery);

      const cachedBudget = this.currentBudgetSubject.value.find(b => b.month === month);
      
      
      console.log("Cached budget: ", cachedBudget);
      
      if (cachedBudget?.budget) {
        this.currentBudgetSubject.next( [...this.currentBudgetSubject.value]);
        return cachedBudget.budget;
      }

      let budget: Budget = { month, totalBudget: 0, spendings: {}, userId: uid, id: '' };
      let totalExpenses = 0;
      expensesSnapshot.docs.forEach(doc => {
        const expenseData = doc.data() as Expense;
        console.log("Expense month: ", expenseData.Date.toDate().getMonth());
        console.log("Argument month: ", month);
        
        
        if (expenseData.Date.toDate().getMonth() + 1 === month) {
          totalExpenses += expenseData.Amount;
          if (budget.spendings[expenseData.Category]) {
            budget.spendings[expenseData.Category] += expenseData.Amount;
          } else {
            budget.spendings[expenseData.Category] = expenseData.Amount;
          }
        }
      }

      );
     

      budget.totalBudget =  totalExpenses;
      console.log("Current budget: ", budget);
      
      if (Object.keys(budget.spendings).length === 0) {
        this.currentBudgetSubject.next([...this.currentBudgetSubject.value]);
        return null;
      }

      const updatedBudgets = this.currentBudgetSubject.value.map(entry => 
        entry.month === month ? { ...entry, budget } : entry
      );
      this.currentBudgetSubject.next(updatedBudgets);
      console.log("Current budget subejct: ", this.currentBudgetSubject.value);
      
      return budget;
    } catch (err) {
      console.error("Error fetching current spendings: ", err);
      return Promise.reject(err);
    }
  }

  async getUserBudgetByMonth(uid: string, month: number): Promise<Budget | null> {
    try {
      const budgetRef = doc(collection(firestore, 'budgets'), `${uid}_${month}`);
      const budgetDoc = await getDoc(budgetRef);
      const cachedBudget = this.cachedBudgetSubject.value.find(b => b.month === month);
      console.log("Cached budget: ", cachedBudget);
      

      if (cachedBudget) {
        this.cachedBudgetSubject.next([...this.cachedBudgetSubject.value]);
        return cachedBudget.budget;
      }
      if (budgetDoc.exists()) {
        this.cachedBudgetSubject.next([...this.cachedBudgetSubject.value, { month, budget: budgetDoc.data() as Budget }]);
        return budgetDoc.data() as Budget;
      }

      this.cachedBudgetSubject.next([...this.cachedBudgetSubject.value]);
      return null;
    } catch (err) {
      console.error("Error fetching user budget: ", err);
      return Promise.reject(err);
    }
  }

  async getTotalBudget(uid: string, month: number): Promise<{ type: string, amount: number }[]> {
    try {
      const incomeQuery = query(collection(firestore, 'incomes'), where('userId', '==', uid));
      const expensesQuery = query(collection(firestore, 'expenses'), where('userId', '==', uid));
      const [incomesSnapshot, expensesSnapshot] = await Promise.all([getDocs(incomeQuery), getDocs(expensesQuery)]);

      let totalIncome = incomesSnapshot.docs.reduce((sum, doc) => {
        const incomeData = doc.data() as Income;
        return incomeData.Date.toDate().getMonth() === month ? sum + incomeData.Amount : sum;
      }, 0);

      let totalExpense = expensesSnapshot.docs.reduce((sum, doc) => {
        const expenseData = doc.data() as Expense;
        return expenseData.Date.toDate().getMonth() === month ? sum + expenseData.Amount : sum;
      }, 0);

      this.totalAmountSubject.next(totalIncome - totalExpense);
      return [{ type: 'Expense', amount: totalExpense }, { type: 'Income', amount: totalIncome }];
    } catch (err) {
      console.error("Error fetching total budget: ", err);
      return Promise.reject(err);
    }
  }

  async addBudget(uid: string, budget: Budget): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', uid);
      const monthBudgetExists = this.cachedBudgetSubject.value.find(b => b.month === budget.month);
      if (monthBudgetExists) {
        const budgetRef = doc(collection(firestore, 'budgets'), `${uid}_${budget.month}`);
        budget.id = budgetRef.id;

        batch.update(budgetRef, { spendings: budget.spendings, totalBudget: budget.totalBudget });
        await batch.commit();
        const updatedBudgets = this.cachedBudgetSubject.value.map(entry =>
          entry.month === budget.month ? { month: budget.month, budget } : entry
        );
        this.cachedBudgetSubject.next(updatedBudgets);
        
        return;
      } else {
        const newBudgetRef = doc(collection(firestore, 'budgets'), `${uid}_${budget.month}`);
        budget.id = newBudgetRef.id;
        batch.set(newBudgetRef, budget);
        batch.update(userDocRef, { Budgets: arrayUnion(budget) });
        await batch.commit();
        this.budgetSubject.next({ month: budget.month, budget });
        this.cachedBudgetSubject.next([...this.cachedBudgetSubject.value, { month: budget.month, budget }]);
      }

    } catch (err) {
      console.error("Error adding budget: ", err);
    }
  }
}