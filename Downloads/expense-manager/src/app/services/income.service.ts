import { Injectable } from '@angular/core';
import { Income } from '../models';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {

  constructor(private http: HttpClient) { }

  incomeSubject: BehaviorSubject<Income[]> = new BehaviorSubject<Income[]>([]); 
  incomes$: Observable<Income[]> = this.incomeSubject.asObservable();
  deleteIncome(uid: string, item: Income) {
    const incomeId = item.id;
    return this.http.delete<any>(`${environment.incomeUrl}/${incomeId}`);
    
  }

  fetchIncomes(uid: string, month: number): Observable<any> {
    return this.http.get<any>(`${environment.incomeUrl}/${uid}/${month}`);
    
  }

  addIncome(income: Income) {
    return this.http.post<any>(`${environment.incomeUrl}/addIncome`, income);
  
  }

  getIncomes(uid: string): Observable<any> {
    return this.http.get<any>(`${environment.incomeUrl}/all/${uid}`);
  }
}
