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

  budgetSubject = new BehaviorSubject<{month: number, budget: Budget} | null>(null);
  budget$ = this.budgetSubject.asObservable();
  
  totalAmountSubject = new BehaviorSubject<number>(0);
  totalAmount$ = this.totalAmountSubject.asObservable();


  changedBudgetSubject = new BehaviorSubject<'Expense' | 'Income' | null>(null);
  changedBudget$ = this.changedBudgetSubject.asObservable();

  cachedBudgetSubject = new BehaviorSubject<{month: number, budget: Budget }[]>([]);

  currentBudgetSubject = new BehaviorSubject<Budget | null>(null);
  currentBudget$ = this.currentBudgetSubject.asObservable();
  constructor() { 

  }

  signalChange(type: 'Expense' | 'Income') {
    this.changedBudgetSubject.next(type);
  }

  async getCurrentSpendings(month: number, uid: string): Promise<Budget | null> {
    try {
      const expenses = collection(firestore, 'expenses');
      const q = query(expenses, where('userId','==',uid));
      const querySnapshot = await getDocs(q);
      let budget: Budget = {
        totalBudget: 0,
        spendings: {},
        month,
        userId: uid
      };

      for (const doc of querySnapshot.docs) {
        const expenseData = doc.data() as Expense;
        console.log("Expense data: ", expenseData);
        
        console.log("Month of expense: ", expenseData.Date.toDate().getMonth());
        
        if (expenseData.Date.toDate().getMonth() + 1 === month) {
          if (budget.spendings[expenseData.Category]) {
            budget.spendings[expenseData.Category] += expenseData.Amount;
          } else {
            budget.spendings[expenseData.Category] = expenseData.Amount;
          }
          budget.totalBudget += expenseData.Amount;
        }
      }
      console.log("Current budget: ", budget);
      if (budget.totalBudget === 0) {
        this.currentBudgetSubject.next(null);
        return null;
      };
      this.currentBudgetSubject.next(budget);
      return budget;
    } catch (err) {
      console.log("Error fetching spendings: ", err);
      return Promise.reject(err);
    }
  }
 

 async getUserBudgetByMonth(uid: string, month: number) : Promise<Budget | null> {
  console.log("Month of the function:" , month);
  console.log("Cached budget: ", this.cachedBudgetSubject.value);
  
  if (this.cachedBudgetSubject.value.some(budget => budget.month === month)) {
    console.log("Budget already cached");
    
    const cachedBudget = this.cachedBudgetSubject.value.find(budget => budget.month === month);
    this.budgetSubject.next(cachedBudget!);
    this.cachedBudgetSubject.next(this.cachedBudgetSubject.value);
    return cachedBudget!.budget;
  }
  
    try {
      const budgetsCollection = collection(firestore, 'budgets');
      const q = query(budgetsCollection, where('userId','==',uid), where('month','==',month));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const budgetData = doc.data() as Budget;
        console.log("Budget data: ", budgetData);
        this.budgetSubject.next({month, budget: budgetData});
        this.cachedBudgetSubject.next([...this.cachedBudgetSubject.value, {month, budget: budgetData}]);
        return budgetData;
      }
      console.log("No budget found");
      
      this.budgetSubject.next(null);
      this.cachedBudgetSubject.next(this.cachedBudgetSubject.value);
      return null;

    }catch(err) {
      console.log("Error fetching budget: ", err);
      return Promise.reject(err);
    }
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
        this.budgetSubject.next({month: budget.month, budget});
        this.cachedBudgetSubject.next(this.cachedBudgetSubject.value.map(b => b.month === budget.month ? {month: budget.month, budget} : b));
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
        this.budgetSubject.next({month: budget.month, budget});
        this.cachedBudgetSubject.next([...this.cachedBudgetSubject.value, {month: budget.month, budget}]);
        return;
      }
    }
    
    } catch(err) {
      console.log("Error adding budget: ", err);
      
    }
  }
    
}


