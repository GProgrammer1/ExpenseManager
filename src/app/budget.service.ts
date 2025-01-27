import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Budget, Expense, Income } from './models';
import { addDoc, collection, DocumentReference, getDoc, getDocs, updateDoc, where } from 'firebase/firestore';
import { firestore } from 'firebase.config';
import { query } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  budgetSubject = new BehaviorSubject<Budget| null>(null);
  budget$ = this.budgetSubject.asObservable();

  totalAmountSubject = new BehaviorSubject<number>(0);
  totalAmount$ = this.totalAmountSubject.asObservable();

  totalIncomesSubject!: BehaviorSubject<{month: number, amount: number}>;
  totalIncomes$!: Observable<{month: number, amount: number}>;

  totalExpensesSubject!: BehaviorSubject<{month: number, amount: number}>;
  totalExpenses$!: Observable<{month: number, amount: number}>;

  changedBudgetSubject = new BehaviorSubject<'Expense' | 'Income' | null>(null);
  changedBudget$ = this.changedBudgetSubject.asObservable();
  constructor() { 
    this.bindData();

  }

  signalChange(type: 'Expense' | 'Income') {
    this.changedBudgetSubject.next(type);
  }
  async bindData() {
    const month = new Date().getMonth();
    const uid = localStorage.getItem('userId')!;
    const totalBudget = await this.getTotalBudget(uid, month);
    const totalExpenses = totalBudget.find(budget => budget.type === 'Expense')?.amount || 0;
    const totalIncomes = totalBudget.find(budget => budget.type === 'Income')?.amount || 0;

    this.totalExpensesSubject = new BehaviorSubject<{month: number, amount: number}>({month, amount: totalExpenses});
    this.totalExpenses$ = this.totalExpensesSubject.asObservable();

    this.totalIncomesSubject = new BehaviorSubject<{month: number, amount: number}>({month, amount: totalIncomes});
    this.totalIncomes$ = this.totalIncomesSubject.asObservable();
  }

 async getUserBudgetByMonth(uid: string, month: number) : Promise<Budget | null> {
  console.log("Month of the function:" , month);
  
    try {
      const budgetsCollection = collection(firestore, 'budgets');
      const q = query(budgetsCollection, where('userId','==',uid), where('month','==',month));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const budgetData = doc.data() as Budget;
        console.log("Budget data: ", budgetData);
        this.budgetSubject.next(budgetData);
        return budgetData;
      }
      
      this.budgetSubject.next(null);
      return null;

    }catch(err) {
      console.log("Error fetching budget: ", err);
      return Promise.reject(err);
    }
  }

  updateTotalExpenses(newExpenseAmount: number, month: number) {
    const initialAmount = this.totalExpensesSubject.value.amount;
    this.totalExpensesSubject.next({month, amount: initialAmount + newExpenseAmount});
  }

  updateTotalIncomes(newIncomeAmount: number, month: number) {
    const initialAmount = this.totalIncomesSubject.value.amount;
    this.totalIncomesSubject.next({month, amount: newIncomeAmount + initialAmount});
  }

   async getTotalBudget(uid: string, month: number): Promise<{type: string, amount: number}[]> {
      console.log("Month in budget function: ", month);
      
      try {
        const incomesCollection = collection(firestore, 'incomes'); 
        const qI = query(incomesCollection, where('userId','==',uid));
        const incomesSnapshot = await getDocs(qI);
        
        let totalIncome = 0;
        for (const doc of incomesSnapshot.docs ) {
          const incomeData = doc.data() as Income;
          if (incomeData.Date.toDate().getMonth() === month) {
            console.log("Income data: ", incomeData);
            totalIncome += incomeData.Amount;
            console.log("Total income: ", totalIncome);
            
          }
        }

        const expensesCollection = collection(firestore, 'expenses');
        const qE = query(expensesCollection, where('userId','==',uid));
        const expensesSnapshot = await getDocs(qE);

        let totalExpense = 0;
        for (const doc of expensesSnapshot.docs) {
          const expenseData = doc.data() as Expense;
          console.log("Expense data date: ", expenseData.Date.toDate().getMonth());
          console.log("Month in function: ", month);
          
          
          if (expenseData.Date.toDate().getMonth() === month) {
            console.log("Expense data: ", expenseData);
            totalExpense += expenseData.Amount;
            console.log("Total expense: ", totalExpense);
            
          }
        }

        const totalBudget = totalIncome - totalExpense;
        console.log("Total budget: ", totalBudget);
        
        this.totalAmountSubject.next(totalBudget);
       
        
        return [{type: 'Expense', amount: totalExpense}, {type: 'Income', amount: totalIncome}];
      } catch (err) {
        console.log("Error fetching total budget: ", err);
        return Promise.reject(err);
      }
       
    }


  async addBudget(uid: string, budget: Budget) : Promise<void>{
    console.error("Budget in addBudget argument: ", budget);
    
    try {
      const budgetsCollection = collection(firestore, 'budgets');
      const qB = query(budgetsCollection, where('userId','==',uid), where('month','==',budget.month));
      const querySnapshotB = await getDocs(qB);
      if (querySnapshotB.size !== 0) {
      for (const doc of querySnapshotB.docs) {
        await updateDoc(doc.ref, {spendings: budget.spendings, totalBudget: budget.totalBudget});
        console.log("Budget updated successfully");
        this.budgetSubject.next(budget);
        return;
      }
    } else {
      const budgetRef = await addDoc(budgetsCollection, budget);
      console.log("Budget added successfully");

      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const userBudgets = userData['Budgets'] as DocumentReference[];
        userBudgets.push(budgetRef);
        await updateDoc(doc.ref, {Budgets: userBudgets});
        console.log("Budget added successfully");
        this.budgetSubject.next(budget);
        return;
      }
    }
    
    } catch(err) {
      console.log("Error adding budget: ", err);
      
    }
  }
    
}


