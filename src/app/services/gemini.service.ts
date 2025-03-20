import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, from, lastValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { environment } from 'src/environments/environment';

import { IncomeService } from './income.service';
import { ExpenseService } from './expense.service';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import config from 'capacitor.config';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor(private http: HttpClient,
    private authService: AuthService, private configService: ConfigService
  ) { 
  
    
  }
 
  user$ = this.authService.user$;
  
 listModels(): Observable<any> {
   const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${environment.key}`;
   return this.http.get(url);
 }



 goalAdvise(description: string, type: 'Expense' | 'Income', deadline: Timestamp, data: any): Observable<any> {
  const message = this.configService.formatMessage(
    this.configService.getConfig('goalAdviceMessage'),
    {
      description,
      deadline: new Date(deadline.seconds * 1000).toLocaleDateString(),
      type,
      data: JSON.stringify(data)
    }
  );  
  return this.http.post(`${environment.geminiUrl}`, {prompt: message});
}

debtPlanAdvice(debt: any, personalInfo: any, balance: any): Observable<any> {
  const message = this.configService.formatMessage(
    this.configService.getConfig('debtPlannerMessage'),
    {
      data: debt,
      personalInfo,
      balance
    }
  );  

  return this.http.post(`${environment.geminiUrl}`, {prompt: message});

}

generateBudget(data: any): Observable<any> {

  const message = this.configService.getConfig('generateBudgetMessage');
  const expenseCategories = this.configService.getConfig('expenseCategories');  
  const formatMessage = this.configService.formatMessage(message, {
    data: JSON.stringify(data),
    categories: expenseCategories
  })  
  return this.http.post(`${environment.geminiUrl}`, {prompt: formatMessage});
}

  buildRequestBody(message: string) {
    return {
      model: this.configService.getConfig('geminiModel'),
  
      contents: [{parts: [{text: message}]}]
    };
  }
  
}

