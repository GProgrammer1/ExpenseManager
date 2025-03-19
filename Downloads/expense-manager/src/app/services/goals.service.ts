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
//TODO:RECONSIDER USAGE OF BATCH
  addGoal(goal: Goal) {
    return this.http.post<any>(`${environment.goalUrl}/addGoal`, goal);
    // try {
    //   const goalsCollection = collection(firestore, 'goals');

    //   const goalRef = doc(goalsCollection);
    //   goal.id = goalRef.id;

    //   const batch = writeBatch(firestore);
    //   batch.set(goalRef, goal);

    //   const usersCollection = collection(firestore, 'users');
    //   const userRef = doc(usersCollection, goal.userId);
    //   batch.update(userRef, {Goals: arrayUnion(goalRef)})
    //   await batch.commit(); // ✅ One efficient commit instead of multiple updates

    //   this.goalsSubject.next([...this.goalsSubject.value, goal]);

    // } catch (ex) {
    //   console.error("🔥 Error adding goal:", ex);
    // }
  }

  getGoals(userId: string) {
    return this.http.get<any>(`${environment.goalUrl}/${userId}`);
    // try {
    //   const goalsCollection = collection(firestore, 'goals');
    //   const goalsQuery = query(goalsCollection, where('userId', '==', userId));
    //   const querySnapshot = await getDocs(goalsQuery);

    //   const goals: Goal[] = querySnapshot.docs.map(doc => doc.data() as Goal);

    //   // ✅ Only update BehaviorSubject if data changed
    //   if (JSON.stringify(this.goalsSubject.value) !== JSON.stringify(goals)) {
    //     this.goalsSubject.next(goals);
    //   }

    //   return goals;
    // } catch (ex) {
    //   console.error("🔥 Error getting goals:", ex);
    //   return [];
    // }
  }

  deleteGoal(goal: Goal) {
    console.log("GOAL TO BE DELETED: ", goal);
    
    const goalId = goal.id;
    return this.http.delete<any>(`${environment.goalUrl}/${goalId}`);
    // const goalId = goal.id;
    // return this.http.delete<any>(`${environment.goalUrl}`${goalId}`);
    // try {
    //   console.log("Deleting goal:", goal);
      
    //   const goalsCollection = collection(firestore, 'goals');
    //   const goalRef = doc(goalsCollection, goal.id);

    //   const batch = writeBatch(firestore);
    //   batch.delete(goalRef);
    //   const userRef = doc(collection(firestore, 'users'), goal.userId);
    //   batch.update(userRef, {Goals: arrayRemove(goalRef)});
    //   await batch.commit();
    //   this.goalsSubject.next(this.goalsSubject.value.filter(g => g.id !== goal.id));

    // } catch (ex) {
    //   console.error("🔥 Error deleting goal:", ex);
    // }

  }

  // saveAdvice(advice: GoalAdvice) {
  //   try {
  //     const goalsCollection = collection(firestore, 'goals');
  //     const goalQuery = query(goalsCollection, where('name', '==', advice.goal.name));
  //     const goalDocs = await getDocs(goalQuery);

  //     const batch = writeBatch(firestore);
  //     goalDocs.forEach((docSnapshot) => {
  //       const advices = (docSnapshot.data() as Goal).advices || [];
  //       batch.update(docSnapshot.ref, { advices: [...advices, advice.advice] });
  //     });

  //     await batch.commit();

  //   } catch (ex) {
  //     console.error("🔥 Error saving advice:", ex);
  //   }
  // }

  // async deleteAdvice(goal: Goal) {
  //   try {
  //     const goalsCollection = collection(firestore, 'goals');
  //     const goalQuery = query(goalsCollection, where('name', '==', goal.name));
  //     const goalDocs = await getDocs(goalQuery);

  //     const batch = writeBatch(firestore);
  //     goalDocs.forEach((docSnapshot) => {
  //       const advices = (docSnapshot.data() as Goal).advices || [];
  //       batch.update(docSnapshot.ref, { advices: advices.filter(a => a !== goal.name) });
  //     });

  //     await batch.commit();

  //   } catch (ex) {
  //     console.error("🔥 Error deleting advice:", ex);
  //   }
  // }

 async updateGoal(goal: Goal) {
  const goalId = goal.id;
  return this.http.put<any>(`${environment.goalUrl}/${goalId}`, goal);
    // const goalId = goal.id;
    // return this.http.put<any>(`${environment.goalUrl}`${goalId}`, goal);

    // try {
    //   const goalsCollection = collection(firestore, 'goals');
    //   const goalQuery = query(goalsCollection, where('name', '==', goal.name));
    //   const goalDocs = await getDocs(goalQuery);

    //   const batch = writeBatch(firestore);
    //   goalDocs.forEach((docSnapshot) => {
    //     return batch.update(docSnapshot.ref, { ...goal });
    //   });

    //   await batch.commit();
    //   console.log("Goal updated successfully");
      

    // } catch (ex) {
    //   console.error("🔥 Error updating goal:", ex);
    // }
  }
}
