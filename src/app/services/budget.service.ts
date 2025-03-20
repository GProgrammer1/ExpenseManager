import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Budget} from '../models';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  budgetSubject = new BehaviorSubject<Budget[] >([]);
  budgets$ = this.budgetSubject.asObservable();

  totalAmountSubject = new BehaviorSubject<number>(0);
  totalAmount$ = this.totalAmountSubject.asObservable();

  currentBudgetsSubject = new BehaviorSubject<Budget[]>([]);
  currentBudgets$ = this.currentBudgetsSubject.asObservable();
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

  cachedBudgetSubject = new BehaviorSubject<{ month: number, budget: Budget | null }[]>(this.initialValues);


  constructor(private http: HttpClient) {}

  signalChange(type: 'Expense' | 'Income', spending?: { category: string, amount: number }, month?: number) {
    console.log("SIGNAL CHANGE TRIGGERED");
    
    this.changedBudgetSubject.next(type);
  
    if (type === 'Expense' && spending && month && spending.amount >= 0) {
      const aimedBudget = this.currentBudgetsSubject.value.find(b => b.month === month);
      if (aimedBudget){
        aimedBudget.totalBudget += spending.amount;
        if (aimedBudget.spendings[spending.category]) {
          aimedBudget.spendings[spending.category] += spending.amount;
          aimedBudget.totalBudget += spending.amount;
        } else {
          aimedBudget.spendings[spending.category] = spending.amount;
          aimedBudget.totalBudget = spending.amount;
        }
        this.currentBudgetsSubject.next(this.currentBudgetsSubject.value.map(entry =>
          entry.month === month ? {...entry, spendings: aimedBudget.spendings} : entry
        ));

      }
      else {
        
      }
      
    }else if (spending && month) {
      const aimedBudget = this.currentBudgetsSubject.value.find(b => b.month === month);
      if (aimedBudget){
        aimedBudget.totalBudget += spending.amount;
        aimedBudget.spendings[spending.category] += spending.amount;
        if (aimedBudget.spendings[spending.category] === 0) {
          delete aimedBudget.spendings[spending.category];
        }        
        this.currentBudgetsSubject.next(this.currentBudgetsSubject.value.map(entry =>
          entry.month === month ? {...entry, spendings: aimedBudget.spendings} : entry
        ));          
    }
    
    }
  }
  

   getCurrentSpendings(month: number, uid: string): Observable<Budget> {
    return this.http.get<Budget>(`${environment.budgetUrl}/current/${uid}/${month}`);
 
  }

   getUserBudgetByMonth(uid: string, month: number): Observable<Budget> {
    return this.http.get<Budget>(`${environment.budgetUrl}/user/${uid}/${month}`);
  
  }

   getTotalBudget(uid: string, month: number): Observable<any> {
    return this.http.get<any>(`${environment.budgetUrl}/total/${uid}/${month}`);
   
  }

  getAllBudgets (uid: string) {
    return this.http.get<any>(`${environment.budgetUrl}/all/${uid}`);
  }

   addBudget(uid: string, budget: Budget): Observable<Budget> {
    return this.http.post<Budget>(`${environment.budgetUrl}/add/${uid}`, budget);
  }
}