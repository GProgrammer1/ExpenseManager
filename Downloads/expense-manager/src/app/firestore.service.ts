import { Injectable } from '@angular/core';
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { app, firestore } from '../../firebase.config';
import { Expense, Income, Subscription } from './models';
import { Auth, browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, User } from 'firebase/auth';
import { HttpClient } from '@angular/common/http';
import { BudgetService } from './budget.service';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

 

  currentTabSubject = new BehaviorSubject<'Expenses' | 'Incomes'>('Expenses');
  currentTab$ = this.currentTabSubject.asObservable();

  async deleteIncome(uid: string, item: Income) {
    try {
      const userDocRef = doc(firestore, 'users', uid);
  
      // Find the exact income document by reference (if stored)
      const incomeRef = doc(firestore, 'incomes', item.id);
      const batch = writeBatch(firestore);
      batch.delete(incomeRef);

     
        batch.update(userDocRef, {
        Incomes: arrayRemove(incomeRef)})
      

      this.incomesSubject.next(this.incomesSubject.value.filter((income) => income.id !== item.id));
      await batch.commit();
    } catch (err) {
      console.error("Error deleting income:", err);
    }
  }
  

  async deleteExpense(uid: string, item: Expense) {
    try {
      const userDocRef = doc(firestore, 'users', uid);  
      const expenseRef = doc(firestore, 'expenses', item.id);
      const batch = writeBatch(firestore);
      batch.delete(expenseRef);

        batch.update(userDocRef, {
          Expenses: arrayRemove(expenseRef)
        });
      

      this.expensesSubject.next(this.expensesSubject.value.filter((expense) => expense.id !== item.id));

      await batch.commit();     
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  }
  
  

  //observer, observable, subscriber
  //next, error, complete
  expensesSubject = new BehaviorSubject<Expense[]>([]);
  expenses$ = this.expensesSubject.asObservable();

  incomesSubject = new BehaviorSubject<Income[]>([]);
  incomes$ = this.incomesSubject.asObservable();

  budgetsSubject = new BehaviorSubject<number[]>([]);
  budgets$ = this.budgetsSubject.asObservable();

  monthSubject = new BehaviorSubject<number>(new Date().getMonth());
  month$ = this.monthSubject.asObservable();

  subscriptionsSubject = new BehaviorSubject<Subscription[]>([]);
  subscriptions$ = this.subscriptionsSubject.asObservable();

  auth: Auth = getAuth(app);
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private budgetService: BudgetService) {
    

    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        // Listen for auth state changes
        onAuthStateChanged(this.auth, (user) => {
          if (user) {
            this.userSubject.next(user); // Update user if logged in
          } else {
            this.userSubject.next(null); // Set to null if logged out
          }
        });
      })
      .catch((error) => {
        console.error('Error setting persistence', error);
      });
  }
  changeMonth(month: number) {
    this.monthSubject.next(month);
  }

  async getAllTransactions(uid: string) {
    try {
      const expensesCollection = collection(firestore, 'expenses');
      const incomesCollection = collection(firestore, 'incomes');
      const q = query(expensesCollection, where('userId', '==', uid));
      const q2 = query(incomesCollection, where('userId', '==', uid));
      const [expensesSnapshot, incomesSnapshot] = await Promise.all([getDocs(q), getDocs(q2)]);
      const expenses = expensesSnapshot.docs.map((doc) => doc.data() as Expense);
      const incomes = incomesSnapshot.docs.map((doc) => doc.data() as Income);
      this.expensesSubject.next(expenses);
      this.incomesSubject.next(incomes);
    } catch (error) {
      console.error('Error fetching transactions:', error);

    }
  }
  
  getFcmToken(deviceId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const deviceTokensCollection = collection(firestore, 'device_tokens');
      const q = query(deviceTokensCollection, where('device_id', '==', deviceId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Device token Data: ", data);
        
        resolve(data['fcmToken']);
      });
      reject('No FCM token found');
    });
  }

  async getExpenseData(uid: string, month:number): Promise<Record<string, number>> {
    const expenses = await this.fetchExpenses(uid, month);
    console.log("Expenses: ", expenses);
  
    if (expenses.length === 0) {
      return {};
    }
  
    // Calculate the total expense amount
    const totalExpenseAmount = expenses.reduce((acc, expense) => acc + expense.Amount, 0);
    console.log("Total expense amount: ", totalExpenseAmount);
  
    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.Category] = (acc[expense.Category] || 0) + expense.Amount;
      return acc;
    }, {} as Record<string, number>);
  
    // Prepare the result object with percentage calculations
    const categoryAmounts: Record<string, number> = {};
  
    // Loop over the grouped categories to calculate Amounts
    for (const [category, amount] of Object.entries(categoryTotals)) {
      categoryAmounts[category] = amount ;
    }
    
    console.log("Category Amounts: ", categoryAmounts);
    return categoryAmounts;
  }
  

  async fetchIncomes(uid: string, month: number): Promise<Income[]> {
    try {
      const incomesCollection = collection(firestore, 'incomes');
      const q = query(incomesCollection, where('userId', '==', uid));

      const incomesSnapshot = await getDocs(q);
      const incomes: Income[] = [];

      for (const doc of incomesSnapshot.docs) {
        const incomeData = doc.data() as Income;
        if (incomeData.Date.toDate().getMonth() === month) {
          incomes.push(incomeData);
        }
      }
      
      return incomes;
    } catch (err) {
      console.log("Error fetching incomes: ", err);
      return Promise.reject(err);
    }
   
  }

  async getIncomeData(uid: string, month:number): Promise<Record<string, number>> {
    console.log("Month in getIncomeData: ", month);
    
    const incomes = await this.fetchIncomes(uid, month);
    console.log("Incomes: ", incomes);
  
    if (incomes.length === 0) {
      return {};
    }
  
    // Calculate the total income amount
    const totalIncomeAmount = incomes.reduce((acc, income) => acc + income.Amount, 0);
    console.log("Total income amount: ", totalIncomeAmount);
  
    // Group incomes by category
    const categoryTotals = incomes.reduce((acc, income) => {
      acc[income.Category] = (acc[income.Category] || 0) + income.Amount;
      return acc;
    }, {} as Record<string, number>);
  
    // Prepare the result object with percentage calculations
    const categoryAmount: Record<string, number> = {};
  
    // Categories you want to calculate percentages for
    const categories = ['Salary', 'Bonus', 'Gig', 'Gift', 'Other', 'Investment'];
  
    // Loop over the grouped categories to calculate percentages
    categories.forEach((category) => {
      const categoryTotal = categoryTotals[category] || 0;
      categoryAmount[category] = categoryTotal;
    });
    console.log("Category Amount: ", categoryAmount);
    
  
    return categoryAmount;
  }
  
  async fetchExpenses(uid: string, month: number): Promise<Expense[]> {
  console.log(`Fetching expenses for UID: ${uid}, Month: ${month}`);

  try {
    const expensesCollection = collection(firestore, 'expenses');
    const q = query(expensesCollection, where('userId', '==', uid));
    const expensesSnapshot = await getDocs(q);

    const batchPromises = expensesSnapshot.docs.map(async (doc) => {
      const expenseData = doc.data() as Expense;
      return expenseData.Date.toDate().getMonth() === month ? expenseData : null;
    });

    const expenses = (await Promise.all(batchPromises)).filter(expense => expense !== null) as Expense[];
    console.log(`Fetched ${expenses.length} expenses for month ${month}`);

    return expenses;
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return Promise.reject(err);
  }
}

  


  // Add a user to Firestore with "already exists" check
  async addUser(user: import('./models').User): Promise<any> {
    try {
      console.log("User: ", user);
      
      const userDocRef = doc(firestore, 'users', user.uid); // Set user.uid as the document ID
      await setDoc(userDocRef, user); // setDoc ensures it uses the specified ID
      
      return userDocRef;
    } catch (error) {
      console.error("Error adding user:", error);
      return Promise.reject(error);
    }
  }

  getCurrentUser() {
    return this.userSubject.asObservable(); // Returns observable to subscribe to user state
  }


  // Get a user by uid from Firestore
  async getUserByuid(uid: string): Promise<import('./models').User> {
    const userDocRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data() as import('./models').User;
    console.log("User data: ", userData);
    return userData;
  }


  async saveUser(user: import('./models').User) {

    try {
      const usersCollection = collection(firestore, 'users');
      await addDoc(usersCollection, user);
    } catch (err) {
      console.log("Error adding user: ", err);
      
    }
  }
  
  
  async getUserExpensesByDate(uid: string, timestamp: Timestamp): Promise<Expense[]> {
    return this.getUserTransactionsByDate(uid, timestamp, 'Expenses') as Promise<Expense[]>;
  }
  
  async getUserIncomesByDate(uid: string, timestamp: Timestamp): Promise<Income[]> {
    return this.getUserTransactionsByDate(uid, timestamp, 'Incomes') as Promise<Income[]>;
  }
  
 
  async getUserTransactionsByDate(
    uid: string,
    timestamp: Timestamp,
    type: 'Expenses' | 'Incomes'
  ): Promise<(Expense | Income)[]> {
    console.log(`Fetching ${type.toLowerCase()} for UID:`, uid);
    console.log('Timestamp:', timestamp.toDate());
  
    try {
      const transactionsCollection = collection(firestore, type.toLowerCase());
      const q = query(transactionsCollection, where('userId', '==', uid));
      const querySnapshot = await getDocs(q); // Consider getDocsFromCache(q) for performance
  
      console.log(`Fetched ${querySnapshot.size} ${type.toLowerCase()}`);
  
      const timestampDate = timestamp.toDate();
      const transactions = querySnapshot.docs
        .map((doc) => doc.data() as Expense | Income)
        .filter((data) => {
          const dataDate = data.Date.toDate();
          return (
            dataDate.getFullYear() === timestampDate.getFullYear() &&
            dataDate.getMonth() === timestampDate.getMonth() &&
            dataDate.getDate() === timestampDate.getDate()
          );
        });
  
      console.log(`${type} for ${uid}:`, transactions);
  
      if (type === 'Expenses') {
        this.expensesSubject.next(transactions as Expense[]);
      } else {
        this.incomesSubject.next(transactions as Income[]);
      }
  
      return transactions;
    } catch (error) {
      console.error(`Error fetching ${type.toLowerCase()}:`, error);
      return Promise.reject(error);
    }
  }
  

  async getCategories(type: string): Promise<string[]> {
    try {
      console.log("Type: ", type);
      
      const categoriesCollection = collection(firestore, type === 'Expense' ? 'expense-categories' : 'income-categories');
      const querySnapshot = await getDocs(categoriesCollection);
      const categories: string[] = [];
      querySnapshot.forEach((doc) => {
        categories.push(doc.data()['Name']);
      });
      console.log("Categories: ", categories);
      return categories;
    }
    catch (error) {
      console.log("Error getting categories: ", error);
      return Promise.reject(error);
    }
  }
  async addExpense(uid: string, expense: Expense) {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const expensesCollection = collection(firestore, 'expenses');
  
      const batch = writeBatch(firestore);
      const expenseDocRef = doc(expensesCollection); // Generate a new document reference
      expense.id = expenseDocRef.id
      batch.set(expenseDocRef, expense); // Add the expense document
      batch.update(userDocRef, {
        Expenses: arrayUnion(expenseDocRef) // Append the new expense reference
      });
  
      await batch.commit();
      const category = expense.Category;
      const amount = expense.Amount;
      
      const month = expense.Date.toDate().getMonth() + 1;
      this.expensesSubject.next([...this.expensesSubject.value, expense]);

      (async() => {
        const currentBudget = this.budgetService.currentBudgetSubject.value?.find((budget) => budget.month === month)!.budget;

      if (!currentBudget) {
        return;
      }
      // Get the previous spendings object
      const previousSpendings = currentBudget?.spendings || {};
      
      // Add to the existing amount or initialize it
      const updatedSpendings = {
        ...previousSpendings,
        [category]: (previousSpendings[category] || 0) + amount
      };
      
      currentBudget!.spendings = updatedSpendings;
      currentBudget!.totalBudget += amount;
      const updatedBudgets = this.budgetService.currentBudgetSubject.value.map((budget) => 
      budget.month === month ? {...budget, budget: currentBudget}: {...budget}
      )
      // Update the budget state
      this.budgetService.currentBudgetSubject.next(updatedBudgets);
    })();
      

    } catch (error) {
      console.error("Error adding expense: ", error);
      return Promise.reject(error);
    }
  }
  

  async addSubscription(subscription: Subscription) {
    try {
      const uid = subscription.userId;
      const userDocRef = doc(firestore, 'users', uid);
      const subscriptionsCollection = collection(firestore, 'subscriptions');
  
      const batch = writeBatch(firestore);
      const subscriptionDocRef = doc(subscriptionsCollection); // Create a new doc reference
      subscription.id = subscriptionDocRef.id;
      batch.set(subscriptionDocRef, subscription); // Add subscription document
      batch.update(userDocRef, {
        Subscriptions: arrayUnion(subscriptionDocRef) // Append new subscription reference
      });
  
      await batch.commit();
  
      this.subscriptionsSubject.next([...this.subscriptionsSubject.value, subscription]);
    } catch (error) {
      console.error("Error adding subscription: ", error);
      return Promise.reject(error);
    }
  }
  

  async getUserSubscriptions(uid: string): Promise<Subscription[]> {
    try {
      const subscriptionsCollection = collection(firestore, 'subscriptions');
      const q = query(subscriptionsCollection, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
  
      const subscriptions = querySnapshot.docs.map(doc => doc.data() as Subscription);
  
      this.subscriptionsSubject.next(subscriptions);
      return subscriptions;
    } catch (error) {
      console.error("Error getting subscriptions: ", error);
      throw error; // No need for reject; `async` functions naturally reject on errors
    }
  }
  

  async deleteSubscription(subscription: Subscription) {
    try {
      const uid = subscription.userId;
      const userDocRef = doc(firestore, 'users', uid);  
      // Query for the subscription document
      const subscriptionRef = doc(firestore, 'subscriptions', subscription.id);  
        const batch = writeBatch(firestore);
        batch.delete(subscriptionRef);

       
        batch.update(userDocRef, {Subscriptions: arrayRemove(subscriptionRef)});

        await batch.commit();
        this.subscriptionsSubject.next(this.subscriptionsSubject.value.filter((sub) => sub.id !== subscription.id));
     
    } catch (error) {
      console.error("Error deleting subscription: ", error);
    }
  }
  

 async addIncome(uid: string, income: Income) {
  console.log("uid in addIncome:", uid);

  try {
    const userDocRef = doc(firestore, 'users', uid);
    const incomesCollection = collection(firestore, 'incomes');

    const batch = writeBatch(firestore);
    const incomeDocRef = doc(incomesCollection); // Create a new doc reference
    income.id = incomeDocRef.id;
    batch.set(incomeDocRef, income); // Add income document
    batch.update(userDocRef, {
      Incomes: arrayUnion(incomeDocRef) // Append new income reference
    });

    await batch.commit();
    this.incomesSubject.next([...this.incomesSubject.value, income]);
  } catch (error) {
    console.log("Error adding income: ", error);
    return Promise.reject(error);
  }
}

  


}
