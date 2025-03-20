import { Injectable } from '@angular/core';
import { Goal } from '../models';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoalsService {
  goalSubject = new BehaviorSubject<Goal[]>([]);
  goals$ = this.goalSubject.asObservable();
  constructor(private http: HttpClient) {}
  addGoal(goal: Goal) {
    return this.http.post<any>(`${environment.goalUrl}/addGoal`, goal);
    
  }

  getGoals(userId: string) {
    return this.http.get<any>(`${environment.goalUrl}/${userId}`);
   
  }

  deleteGoal(goal: Goal) {
    console.log("GOAL TO BE DELETED: ", goal);
    
    const goalId = goal.id;
    return this.http.delete<any>(`${environment.goalUrl}/${goalId}`);

  }


 async updateGoal(goal: Goal) {
  const goalId = goal.id;
  return this.http.put<any>(`${environment.goalUrl}/${goalId}`, goal);
  }
}
