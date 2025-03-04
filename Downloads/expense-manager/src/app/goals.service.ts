import { Injectable } from '@angular/core';
import { Goal, GoalAdvice, User } from './models';
import { firestore } from 'firebase.config';
import { addDoc, collection, getDocs, query, updateDoc, where, doc, writeBatch, getDoc, DocumentReference, arrayUnion, arrayRemove } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoalsService {
  goalsSubject = new BehaviorSubject<Goal[]>([]);
  goals$ = this.goalsSubject.asObservable();
  constructor() {}

  async addGoal(goal: Goal) {
    try {
      const goalsCollection = collection(firestore, 'goals');

      const goalRef = doc(goalsCollection);
      goal.id = goalRef.id;

      const batch = writeBatch(firestore);
      batch.set(goalRef, goal);

      const usersCollection = collection(firestore, 'users');
      const userRef = doc(usersCollection, goal.userId);
      batch.update(userRef, {Goals: arrayUnion(goalRef)})
      await batch.commit(); // ✅ One efficient commit instead of multiple updates

      this.goalsSubject.next([...this.goalsSubject.value, goal]);

    } catch (ex) {
      console.error("🔥 Error adding goal:", ex);
    }
  }

  async getGoals(userId: string) {
    try {
      const goalsCollection = collection(firestore, 'goals');
      const goalsQuery = query(goalsCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(goalsQuery);

      const goals: Goal[] = querySnapshot.docs.map(doc => doc.data() as Goal);

      // ✅ Only update BehaviorSubject if data changed
      if (JSON.stringify(this.goalsSubject.value) !== JSON.stringify(goals)) {
        this.goalsSubject.next(goals);
      }

      return goals;
    } catch (ex) {
      console.error("🔥 Error getting goals:", ex);
      return [];
    }
  }

  async deleteGoal(goal: Goal) {
    try {
      console.log("Deleting goal:", goal);
      
      const goalsCollection = collection(firestore, 'goals');
      const goalRef = doc(goalsCollection, goal.id);

      const batch = writeBatch(firestore);
      batch.delete(goalRef);
      const userRef = doc(collection(firestore, 'users'), goal.userId);
      batch.update(userRef, {Goals: arrayRemove(goalRef)});
      await batch.commit();
      this.goalsSubject.next(this.goalsSubject.value.filter(g => g.id !== goal.id));

    } catch (ex) {
      console.error("🔥 Error deleting goal:", ex);
    }

  }

  // async saveAdvice(advice: GoalAdvice) {
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
    try {
      const goalsCollection = collection(firestore, 'goals');
      const goalQuery = query(goalsCollection, where('name', '==', goal.name));
      const goalDocs = await getDocs(goalQuery);

      const batch = writeBatch(firestore);
      goalDocs.forEach((docSnapshot) => {
        return batch.update(docSnapshot.ref, { ...goal });
      });

      await batch.commit();
      console.log("Goal updated successfully");
      

    } catch (ex) {
      console.error("🔥 Error updating goal:", ex);
    }
  }
}
