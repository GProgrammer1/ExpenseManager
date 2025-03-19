import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Expense } from '../models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  constructor(private http: HttpClient) { }

  expenseSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expenseSubject.asObservable();
  
     deleteExpense(uid: string, item: Expense) {
      const expenseId = item.id;
      return this.http.delete<any>(`${environment.expenseUrl}/${expenseId}`);
      // try {
      //   const userDocRef = doc(firestore, 'users', uid);  
      //   const expenseRef = doc(firestore, 'expenses', item.id);
      //   const batch = writeBatch(firestore);
      //   batch.delete(expenseRef);
  
      //     batch.update(userDocRef, {
      //       Expenses: arrayRemove(expenseRef)
      //     });
        
  
      //   this.expensesSubject.next(this.expensesSubject.value.filter((expense) => expense.id !== item.id));
  
      //   await batch.commit();     
      // } catch (err) {
      //   console.error("Error deleting expense:", err);
      // }
    }

   getExpenses(uid: string): Observable<any> {
      return this.http.get<any>(`${environment.expenseUrl}/all/${uid}`);
      // try {
      //   const expensesCollection = collection(firestore, 'expenses');
      //   const q = query(expensesCollection, where('userId', '==', uid));
      //   const expensesSnapshot = await getDocs(q);
    
      //   const expenses = expensesSnapshot.docs.map((doc) => doc.data() as Expense);
      //   console.log(`Fetched ${expenses.length} expenses`);
    
      //   return expenses;
      // } catch (err) {
      //   console.error("Error fetching expenses:", err);
      //   return Promise.reject(err);
      // }
    }

    fetchExpenses(uid: string, month: number): Observable<any> {
      return this.http.get<any>(`${environment.expenseUrl}/${uid}/${month}`);
      // console.log(`Fetching expenses for UID: ${uid}, Month: ${month}`);
    
      // try {
      //   const expensesCollection = collection(firestore, 'expenses');
      //   const q = query(expensesCollection, where('userId', '==', uid));
      //   const expensesSnapshot = await getDocs(q);
    
      //   const batchPromises = expensesSnapshot.docs.map( (doc) => {
      //     const expenseData = doc.data() as Expense;
      //     return expenseData.Date.toDate().getMonth() === month ? expenseData : null;
      //   });
    
      //   const expenses = (await Promise.all(batchPromises)).filter(expense => expense !== null) as Expense[];
      //   console.log(`Fetched ${expenses.length} expenses for month ${month}`);
    
      //   return expenses;
      // } catch (err) {
      //   console.error("Error fetching expenses:", err);
      //   return Promise.reject(err);
      // }
    }
    

    // getUserTransactionsByDate(
    //   uid: string,
    //   timestamp: Timestamp,
    //   type: 'Expenses' | 'Incomes'
    // ): Promise<(Expense | Income)[]> {
    //   console.log(`Fetching ${type.toLowerCase()} for UID:`, uid);
    //   console.log('Timestamp:', timestamp.toDate());
    
    //   // try {
    //   //   const transactionsCollection = collection(firestore, type.toLowerCase());
    //   //   const q = query(transactionsCollection, where('userId', '==', uid));
    //   //   const querySnapshot = await getDocs(q); // Consider getDocsFromCache(q) for performance
    
    //   //   console.log(`Fetched ${querySnapshot.size} ${type.toLowerCase()}`);
    
    //   //   const timestampDate = timestamp.toDate();
    //   //   const transactions = querySnapshot.docs
    //   //     .map((doc) => doc.data() as Expense | Income)
    //   //     .filter((data) => {
    //   //       const dataDate = data.Date.toDate();
    //   //       return (
    //   //         dataDate.getFullYear() === timestampDate.getFullYear() &&
    //   //         dataDate.getMonth() === timestampDate.getMonth() &&
    //   //         dataDate.getDate() === timestampDate.getDate()
    //   //       );
    //   //     });
    
    //   //   console.log(`${type} for ${uid}:`, transactions);
    
    //   //   if (type === 'Expenses') {
    //   //     this.expensesSubject.next(transactions as Expense[]);
    //   //   } else {
    //   //     this.incomesSubject.next(transactions as Income[]);
    //   //   }
    
    //   //   return transactions;
    //   // } catch (error) {
    //   //   console.error(`Error fetching ${type.toLowerCase()}:`, error);
    //   //   return Promise.reject(error);
    //   // }
    // }

    addExpense(expense: Expense) {
      return this.http.post<any>(`${environment.expenseUrl}/addExpense`, expense);
      // try {
      //   const userDocRef = doc(firestore, 'users', uid);
      //   const expensesCollection = collection(firestore, 'expenses');
    
      //   const batch = writeBatch(firestore);
      //   const expenseDocRef = doc(expensesCollection); // Generate a new document reference
      //   expense.id = expenseDocRef.id
      //   batch.set(expenseDocRef, expense); // Add the expense document
      //   batch.update(userDocRef, {
      //     Expenses: arrayUnion(expenseDocRef) // Append the new expense reference
      //   });
    
      //   await batch.commit();
      //   const category = expense.Category;
      //   const amount = expense.Amount;
        
      //   const month = expense.Date.toDate().getMonth() + 1;
      //   this.expensesSubject.next([...this.expensesSubject.value, expense]);
  
      //   (() => {
      //     const currentBudget = this.budgetService.currentBudgetSubject.value?.find((budget) => budget.month === month)!.budget;
  
      //   if (!currentBudget) {
      //     return;
      //   }
      //   // Get the previous spendings object
      //   const previousSpendings = currentBudget?.spendings || {};
        
      //   // Add to the existing amount or initialize it
      //   const updatedSpendings = {
      //     ...previousSpendings,
      //     [category]: (previousSpendings[category] || 0) + amount
      //   };
        
      //   currentBudget!.spendings = updatedSpendings;
      //   currentBudget!.totalBudget += amount;
      //   const updatedBudgets = this.budgetService.currentBudgetSubject.value.map((budget) => 
      //   budget.month === month ? {...budget, budget: currentBudget}: {...budget}
      //   )
      //   // Update the budget state
      //   this.budgetService.currentBudgetSubject.next(updatedBudgets);
      // })();
        
  
      // } catch (error) {
      //   console.error("Error adding expense: ", error);
      //   return Promise.reject(error);
      // }
    }
    
}
