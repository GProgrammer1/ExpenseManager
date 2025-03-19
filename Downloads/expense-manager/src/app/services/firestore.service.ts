import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Expense, Income, Subscription } from '../models';
import { User } from '../models';
//TODO: REMOVE SHITTY CODE
@Injectable({ providedIn: 'root' })
export class FirestoreService {

 

  currentTabSubject = new BehaviorSubject<'Expenses' | 'Incomes'>('Expenses');
  currentTab$ = this.currentTabSubject.asObservable();  

  monthSubject = new BehaviorSubject<number>(new Date().getMonth());
  month$ = this.monthSubject.asObservable();


  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  chartTypeSubject = new BehaviorSubject<string>('pie');
  chartType$ = this.chartTypeSubject.asObservable();

  constructor() {
  }
  changeMonth(month: number) {
    this.monthSubject.next(month);
  }
  
  changeChartType(chartType: string) {
    this.chartTypeSubject.next(chartType);
  }


}
