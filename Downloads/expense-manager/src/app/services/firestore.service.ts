import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Expense, Income, Subscription } from '../models';
import { User } from '../models';
//TODO: REMOVE SHITTY CODE
@Injectable({ providedIn: 'root' })
export class FirestoreService {

 

  currentTabSubject = new BehaviorSubject<'Expenses' | 'Incomes'>('Expenses');
  currentTab$ = this.currentTabSubject.asObservable();  

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

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  chartTypeSubject = new BehaviorSubject<string>('pie');
  chartType$ = this.chartTypeSubject.asObservable();

  constructor() {
    

    // setPersistence(this.auth, browserLocalPersistence)
    //   .then(() => {
    //     // Listen for auth state changes
    //     onAuthStateChanged(this.auth, (user) => {
    //       if (user) {
    //         this.userSubject.next(user); // Update user if logged in
    //       } else {
    //         this.userSubject.next(null); // Set to null if logged out
    //       }
    //     });
    //   })
    //   .catch((error) => {
    //     console.error('Error setting persistence', error);
    //   });
  }
  changeMonth(month: number) {
    this.monthSubject.next(month);
  }
  
  changeChartType(chartType: string) {
    this.chartTypeSubject.next(chartType);
  }
  
  getCurrentUser() {
    return this.userSubject.asObservable(); // Returns observable to subscribe to user state
  }

}
