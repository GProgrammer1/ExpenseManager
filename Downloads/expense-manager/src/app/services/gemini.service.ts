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

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
//TODO: RESEARCH WHY EXTERNALIZE PARAMS

  private model:string;
  private geminiUrl: string;

  constructor(private http: HttpClient,
    private authService: AuthService, private configService: ConfigService
  ) { 
    this.model = configService.getConfig('geminiModel');
    this.geminiUrl = configService.getConfig('geminiUrl');
    console.log("Gemini url oin constrreuctor: ", this.geminiUrl);
    
  }

 
  user$ = this.authService.user$;
  
 listModels(): Observable<any> {
   const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${environment.key}`;
   return this.http.get(url);
 }



 goalAdvise(description: string, type: 'Expense' | 'Income', data: any): Observable<any> {
  const message = this.configService.formatMessage(
    this.configService.getConfig('goalAdviceMessage'),
    {
      description,
      type,
      data: JSON.stringify(data)
    }
  );

  console.log("Message: ", message);
  

  return this.http.post(`http://10.169.37.156:3000/gemini/api/gemini`, {prompt: message});

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
  console.log("Message: ", message);
  

  return this.http.post(`http://10.169.37.156:3000/gemini/api/gemini`, {prompt: message});

}

generateBudget(data: any): Observable<any> {

  const message = this.configService.getConfig('generateBudgetMessage');
  const expenseCategories = this.configService.getConfig('expenseCategories');
  console.log("Expense categories: ", expenseCategories);
  
  const formatMessage = this.configService.formatMessage(message, {
    data: JSON.stringify(data),
    categories: expenseCategories
  })
  console.log("Message: ", formatMessage);
  
  return this.http.post(`http://10.169.37.156:3000/gemini/api/gemini`, {prompt: formatMessage});
  // const message = "Hello gemini , give me 5 bigggest thingsin the universe";
  // const model = 'gemini-1.5-flash';
  // const body = {
  //   model,
  //   contents: [{parts: [{text: message}]}]
  // };
  // const headers = new HttpHeaders({
  //   'Content-Type': 'application/json',
  //   'x-goog-api-key': environment.key, // Explicitly adding API key
  //   'Authorization' : `Bearer ${environment.key}`
  // });
  
  // console.log("Body: ", body);
  // return this.http.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyD-0T7c1ScNzmcPERUx4M2mfLvEoUU4s7Q", body,{headers});
}

  buildRequestBody(message: string) {
    return {
      model: this.configService.getConfig('geminiModel'),
  
      contents: [{parts: [{text: message}]}]
    };
  }

  // estimateGoalProgress(goal: Goal): Observable<number> {
  //   const currentMonth = new Date().getMonth();
  //   const data$ = goal.type === 'Expense'
  //     ? this.expenseService.fetchExpenses(goal.userId, currentMonth)
  //     : this.incomeService.fetchIncomes(goal.userId, currentMonth);
  
  //   const personalInfo$ = this.authService.getUserByuid(goal.userId);
  
  //   return combineLatest([data$, personalInfo$]).pipe(
  //     map(([transactions, personalInfo]) => {
  //       console.log("Transactions: ", transactions);
  //       console.log("Personal info: ", personalInfo);
        
  //       const message = `My goal is: ${goal.description}. Based on my transactions: ${JSON.stringify(transactions)} 
  //       and my personal background: ${JSON.stringify(personalInfo)}, evaluate my goal accomplishment percentage. 
  //       Provide only a number representing the percentage. Ensure accuracy in the assessment.`;
  
  //       return this.buildRequestBody(message);
  //     }),
  //     switchMap((body) => this.http.post<number>(this.apiUrl, body))
  //   );
  // }
  
}

//TODO: