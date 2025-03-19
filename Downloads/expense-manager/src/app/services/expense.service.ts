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
  
     deleteExpense(item: Expense) {
      const expenseId = item.id;
      return this.http.delete<any>(`${environment.expenseUrl}/${expenseId}`);
    }

   getExpenses(uid: string): Observable<any> {
      return this.http.get<any>(`${environment.expenseUrl}/all/${uid}`);
    
    }

    fetchExpenses(uid: string, month: number): Observable<any> {
      return this.http.get<any>(`${environment.expenseUrl}/${uid}/${month}`);
    }

    addExpense(expense: Expense) {
      return this.http.post<any>(`${environment.expenseUrl}/addExpense`, expense);
     
    }
    
}
