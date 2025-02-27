import { Injectable, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { addDoc, collection, deleteDoc, doc, DocumentReference, Firestore, getDoc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { app, firestore } from '../../firebase.config';
import { Expense, Income, Subscription } from './models';
import { Auth, browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, User } from 'firebase/auth';
import { LogarithmicScale } from 'chart.js';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FirestoreService {

  async deleteIncome(uid: string, item: Income) {
    try {
      const incomesCollection = collection(firestore, 'incomes');
      const q = query(incomesCollection, where('Amount', '==', item.Amount), where('Category', '==', item.Category), where('Description', '==', item.Description), where('Date', '==', item.Date), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);

      const incomeRefs = querySnapshot.docs.map((doc) => doc.ref);

      for (const incomeRef of incomeRefs) {
        await deleteDoc(incomeRef);
      }

      const usersCollection = collection(firestore, 'users');
      const q2 = query(usersCollection, where('uid', '==', uid)); 
      const querySnapshotU = await getDocs(q2);
let updatedIncomesData = [] as Income[];
      for (const doc of querySnapshotU.docs) {
        const userData = doc.data();
        const userIncomeRefs = userData['Incomes'] as DocumentReference[] ?? [];
        const updatedIncomes = userIncomeRefs.filter((ref) => !incomeRefs.some((incomeRef) => incomeRef.path === ref.path));
        const updatedIncomesDataPromises = updatedIncomes.map(async (ref) => {
          const doc = await getDoc(ref);
          return doc.data() as Income;
        });
        updatedIncomesData = await Promise.all(updatedIncomesDataPromises);
        console.log("Updated incomes: ", updatedIncomes);
        
        await updateDoc(doc.ref, { Incomes: updatedIncomes });
      }
      this.incomesSubject.next(updatedIncomesData.filter((income) => income.Date.toDate().getDay() === item.Date.toDate().getDay()));
    } catch (err) {
      console.log("Error deleting income: ", err);
      
    }
  }


  async deleteExpense(uid: string, item: Expense) {
    try {
      const expensesCollection = collection(firestore, 'expenses');
      const q = query(expensesCollection, where('Amount', '==', item.Amount), where('Category', '==', item.Category), where('Date', '==', item.Date), where('Description', '==', item.Description), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);

      const expenseRefs = querySnapshot.docs.map((doc) => doc.ref);
      console.log("Expense refs: ", expenseRefs);
      

      for (const expenseRef of expenseRefs) {
        await deleteDoc(expenseRef);
      }

      const usersCollection = collection(firestore, 'users');
      const q2 = query(usersCollection, where('uid', '==', uid)); 
      const querySnapshotU = await getDocs(q2);
      let updatedExpensesData = [] as Expense[];
      for (const doc of querySnapshotU.docs) {
        const userData = doc.data();
        const userExpenseRefs = userData['Expenses'] as DocumentReference[] ?? [];
        const updatedExpenses = userExpenseRefs.filter((ref) => !expenseRefs.some((expenseRef) => expenseRef.path === ref.path));
        const updatedExpensesDataPromises = updatedExpenses.map(async (ref) => {
          const doc = await getDoc(ref);
          return doc.data() as Expense;
        });
        
        console.log("Updated Expenses: ", updatedExpenses);
        updatedExpensesData = await Promise.all(updatedExpensesDataPromises);
        await updateDoc(doc.ref, { Expenses: updatedExpenses });
      }
      
      console.log("Expenses subject value: ", this.expensesSubject.value);
      
      this.expensesSubject.next(updatedExpensesData.filter((expense) => expense.Date.toDate().getDay() === item.Date.toDate().getDay()));
    } catch (err) {
      console.log("Error deleting expense: ", err);
      
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

  constructor(private http: HttpClient) {
    

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
      const incomesCollection = await collection(firestore, 'incomes');
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
    const categories = ['Salary', 'Bonus', 'Gig', 'Gift', 'Other'];
  
    // Loop over the grouped categories to calculate percentages
    categories.forEach((category) => {
      const categoryTotal = categoryTotals[category] || 0;
      categoryAmount[category] = categoryTotal;
    });
    console.log("Category Amount: ", categoryAmount);
    
  
    return categoryAmount;
  }
  
  async fetchExpenses(uid: string, month:number): Promise<Expense[]> {
    console.log("Uid in fetchExpenses: ", uid, 'Month: ', month);
    
    try {
      const expensesCollection = collection(firestore, 'expenses');
      const q = query(expensesCollection, where('userId', '==', uid));

      const expensesSnapshot = await getDocs(q);
      const expenses: Expense[] = [];

      for (const doc of expensesSnapshot.docs) {
        const expenseData = doc.data() as Expense;
        console.log("Expense data: ", expenseData);
        console.log("Expense data month: ", expenseData.Date.toDate().getMonth(), "arg month: ", month);
        console.log(expenseData.Date.toDate().getMonth() == month);
        
        
        if (expenseData.Date.toDate().getMonth() == month) {
          expenses.push(expenseData);
          console.log("Expenses: ", expenses);
          
        }
      }
      
      return expenses;
    } catch (err) {
      console.log("Error fetching expenses: ", err);
      return Promise.reject(err);
    }
  }

 
  


  // Add a user to Firestore with "already exists" check
  async addUser(user: import('./models').User): Promise<any> {
    const usersCollection = collection(firestore, 'users');

    try {
        console.log("User: ", user);
        
        const docRef = await addDoc(usersCollection, user);
        return docRef;
    
    } catch (error) {
      // Handle any other errors (e.g., network issues)
      return Promise.reject(error);
    }
  }
  getCurrentUser() {
    return this.userSubject.asObservable(); // Returns observable to subscribe to user state
  }


  // Get a user by uid from Firestore
  async getUserByuid(uid: string): Promise<import('./models').User[]> {
    const usersCollection = collection(firestore, 'users');
    const q = query(usersCollection, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    const users: any[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    console.log("Users: ", users);

    return users;
  }

 
  async getUserTransactionsByDate(
    uid: string,
    timestamp: Timestamp,
    type: 'Expenses' | 'Incomes'
  ): Promise<(Expense | Income)[]> {
    console.log(`Getting ${type.toLowerCase()} for: `, uid);
  
    console.log("Timestamp: ", timestamp);
    
    
    try {
      const transactionsCollection = collection(firestore, type.toLowerCase());
      const q = query(transactionsCollection, where('userId', '==', uid),);
      const querySnapshot = await getDocs(q);

      console.log("QuerySnapshot: ", querySnapshot.docs);
      

      const transactions: (Expense | Income)[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Expense | Income;
        console.log("Data: ", data.Date);

        console.log("Given timestamp: ", timestamp.toDate().getDay());
        console.log("Data timestamp: ", data.Date.toDate().getTime());
        
        const dataDate = data.Date.toDate();
        const timestampDate = timestamp.toDate();
        
        // Compare the full date (year, month, day)
        if (dataDate.getFullYear() === timestampDate.getFullYear() && 
            dataDate.getMonth() === timestampDate.getMonth() && 
            dataDate.getDate() === timestampDate.getDate()) {
            transactions.push(data);
        }
        
      });
      console.log(`${type} for ${uid}: `, transactions);
      if (type === 'Expenses') {
        this.expensesSubject.next(transactions as Expense[]);
      }
      else {
        this.incomesSubject.next(transactions as Income[]);
      }
      console.log("Transactions: ", transactions);
      
      return transactions;
    } catch (error) {
      console.log(`Error getting ${type.toLowerCase()}: `, error);
      return Promise.reject(error);
    }
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
  
 


  async getCategories(type: string): Promise<string[]> {
    try {
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
      const expensesCollection = collection(firestore, 'expenses') ;
      const docRef = await addDoc(expensesCollection, expense);

      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const expenseRefs = userData['Expenses'] as DocumentReference[] ?? [];
        expenseRefs.push(docRef);
        await updateDoc(doc.ref, { Expenses: expenseRefs });
      }
      this.expensesSubject.next([...this.expensesSubject.value, expense]);
    } catch (error) {
      console.log("Error adding expense: ", error);
      return Promise.reject(error);
    }
  }

  async addSubscription(subscription: Subscription) {
    try {
      const uid = subscription.userId;
      const subscriptionsCollection = collection(firestore, 'subscriptions');
      const docRef = await addDoc(subscriptionsCollection, subscription);

      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        console.log("User data: ", userData);
        
        const subscriptionRefs = userData['Subscriptions'] as DocumentReference[] ?? [];
        subscriptionRefs.push(docRef);
        await updateDoc(doc.ref, { Subscriptions: subscriptionRefs });
      }
      this.subscriptionsSubject.next([...this.subscriptionsSubject.value, subscription
      ]);

    } catch (error) {
      console.log("Error adding subscription: ", error);
      return Promise.reject(error);
    }
  }

  getUserSubscriptions(uid: string): Promise<Subscription[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscriptionsCollection = collection(firestore, 'subscriptions');
        const q = query(subscriptionsCollection, where('userId', '==', uid));
        const querySnapshot = await getDocs(q);
        const subscriptions: Subscription[] = [];
        querySnapshot.forEach((doc) => {
          subscriptions.push(doc.data() as Subscription);
        });
        this.subscriptionsSubject.next(subscriptions);
        resolve(subscriptions);
      } catch (error) {
        console.log("Error getting subscriptions: ", error);
        reject(error);
      }
    }
  );
  }

  async deleteSubscription(subscription: Subscription) {
    try {
      const uid = subscription.userId;
      const subscriptionsCollection = collection(firestore, 'subscriptions');
      const q = query(subscriptionsCollection, where('userId', '==', uid), where('name', '==', subscription.name));
      const querySnapshot = await getDocs(q);

      const subscriptionRefs = querySnapshot.docs.map((doc) => doc.ref);

      for (const subscriptionRef of subscriptionRefs) {
        await deleteDoc(subscriptionRef);
      }
      this.subscriptionsSubject.next(this.subscriptionsSubject.value.filter((sub) => sub.name !== subscription.name));
      const usersCollection = collection(firestore, 'users');
      const q2 = query(usersCollection, where('uid', '==', uid));
      const querySnapshotU = await getDocs(q2);

      for (const doc of querySnapshotU.docs) {
        const userData = doc.data();
        const userSubscriptionRefs = userData['Subscriptions'] as DocumentReference[] ?? [];
        const updatedSubscriptions = userSubscriptionRefs.filter((ref) => !subscriptionRefs.some((subscriptionRef) => subscriptionRef.path === ref.path));
        await updateDoc(doc.ref, { Subscriptions: updatedSubscriptions });
      }
    }
    catch (error) {
      console.error("Error deleting subscription: ", error);
    }
  }

 
  async addIncome(uid: string, income: Income) {
    console.log("uid in addIncome:", uid);
    
    try {
      const incomesCollection = collection(firestore, 'incomes');
      const docRef = await addDoc(incomesCollection, income);

      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const incomeRefs = userData['Incomes'] as DocumentReference[] ?? [];
        incomeRefs.push(docRef);
        await updateDoc(doc.ref, { Incomes: incomeRefs });
      }
      this.incomesSubject.next([...this.incomesSubject.value, income]);
    } catch (error) {
      console.log("Error adding income: ", error);
      return Promise.reject(error);
    }
  }


}
