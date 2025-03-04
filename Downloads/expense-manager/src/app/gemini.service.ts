import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, from, lastValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { environment } from 'src/environments/environment';
import { firestore } from 'firebase.config';
import { collection, getDocs, query } from 'firebase/firestore';
import { Category, Goal } from './models';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {


  constructor(private http: HttpClient, private firestoreService: FirestoreService) { }

  model = 'gemini-1.5-flash';
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${environment.key}`;

 
  
 listModels(): Observable<any> {
   const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${environment.key}`;
   return this.http.get(url);
 }

 goalAdvise(description: string, type: 'Expense' | 'Income'): Observable<any> {
  try {

    console.log("Getting goal advice for:", description, type);
    
  const userId = localStorage.getItem('userId');
  const currentMonth = new Date().getMonth();

  const data$ = from(type === 'Expense' 
    ? this.firestoreService.fetchExpenses(userId!, currentMonth) 
    : this.firestoreService.fetchIncomes(userId!, currentMonth));

    
  return data$.pipe(
    map(data => {
      const message = `From my current ${type}s this month: ${JSON.stringify(data)}, where do I stand on this goal: ${description} and what can I do to improve? `;
      return this.buildRequestBody(message);
   } ),
    switchMap(body => this.http.post(this.apiUrl, body))
  );
} catch (ex) {
  console.error("🔥 Error getting goal advice:", ex);
  return new Observable();
}
}

generateBudget(data: any): Observable<any> {
  const categories$ = from(
    (async () => {
      try {
        const categoriesCollection = collection(firestore, 'expense-categories');
        const q = query(categoriesCollection);
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map((doc) => {
          const docData = doc.data() as Category;
          return docData.Name;
        });
      } catch (ex: any) {
        console.error('Error getting categories: ', ex.message);
        return null;
      }
    })()
  );

  return categories$.pipe(
    switchMap((categories: string[] | null) => {
      console.log('Categories: ', categories);

      const message = `Look at this user information: ${JSON.stringify(data)},
      Now design a monthly budget that decides the amount for each of these expense categories: ${categories}
      that is fit to the user's financial status derived from these attributes.
       (don't neglect essential expense categories like housing, food, health and education and by default if theres no income slary info assume the 
       user has a minimum of 2000$ monthly income).
      Write this budget in the format of a JSON object where each key is the name of the category and the value
      is the allocated budget, put it in one line so I can extract it from your response and design it for the user.
      JUST GIVE ME THE JSON OBJECT AS THE ANSWER
      `;

      const body = this.buildRequestBody(message);

      return this.http.post(this.apiUrl, body);
    })
  );
}

  buildRequestBody(message: string) {
    return {
      model: this.model,
  
      contents: [{parts: [{text: message}]}]
    };
  }

  estimateGoalProgress(goal: Goal): Observable<any> {

    const currentMonth = new Date().getMonth();
    const data$ = goal.type === 'Expense' ?
      this.firestoreService.fetchExpenses(goal.userId, currentMonth) :
      this.firestoreService.fetchIncomes(goal.userId, currentMonth);

    const personalInfo$ = this.firestoreService.getUserByuid(goal.userId);

    const input$ = combineLatest([data$, personalInfo$]).pipe(
      map(
      ([transactions, personalInfo]) => {
        console.log("Transactions: ", transactions);
        
        const message = `My goal is: ${JSON.stringify(goal.description)} and now I want you by looking at my
        transactionns: ${JSON.stringify(transactions)} to see the amount and assess my situation based
        on my personal background :${JSON.stringify(personalInfo)} to give me the percentage of accomplishment
        of the goal, put it in one line and extract it so I can update it for the user to see. Just give me the percentage
         as the answer(a number)`;

        return this.buildRequestBody(message); 
      }
    ), 
    switchMap((body) =>{
      return this.http.post(this.apiUrl, body)
    })
    );

    return input$; 
  }
}

