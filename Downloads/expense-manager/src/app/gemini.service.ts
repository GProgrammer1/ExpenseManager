import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, lastValueFrom, map, Observable, switchMap } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { environment } from 'src/environments/environment';

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
    map(data => ({
      model: this.model,
      contents: [{ parts: [{ text: `From my current ${type}s this month: ${JSON.stringify(data)}, where do I stand on this goal: ${description} and what can I do to improve? ` }] }]
    }) ),
    switchMap(body => this.http.post(this.apiUrl, body))
  );
} catch (ex) {
  console.error("🔥 Error getting goal advice:", ex);
  return new Observable();
}
}
}
