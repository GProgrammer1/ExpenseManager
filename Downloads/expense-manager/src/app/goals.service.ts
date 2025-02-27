import { Injectable } from '@angular/core';
import { Goal, GoalAdvice, User } from './models';
import { firestore } from 'firebase.config';
import { addDoc, collection, getDocs, query, updateDoc, where, doc, writeBatch, getDoc } from 'firebase/firestore';
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

      // ✅ Ensure Firestore completes adding before proceeding
      const docRef = await addDoc(goalsCollection, goal);
      console.log('Goal added with ID: ', docRef.id);

      // ✅ Use batched writes for efficiency
      const usersCollection = collection(firestore, 'users');
      const userQuery = query(usersCollection, where('uid', '==', goal.userId));
      const userDocs = await getDocs(userQuery);

      const batch = writeBatch(firestore);
      userDocs.forEach((docSnapshot) => {
        const userData = docSnapshot.data() as User;
        const userGoals = userData.Goals || [];
        batch.update(docSnapshot.ref, { Goals: [...userGoals, goal] });
      });

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
      const goalsCollection = collection(firestore, 'goals');
      const goalQuery = query(goalsCollection, where('name', '==', goal.name));
      const goalDocs = await getDocs(goalQuery);

      const batch = writeBatch(firestore);
      goalDocs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      this.goalsSubject.next(this.goalsSubject.value.filter(g => g.name !== goal.name));

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
