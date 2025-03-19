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
    // try {
    //   const userDocRef = doc(firestore, 'users', uid);
  
    //   // Find the exact income document by reference (if stored)
    //   const incomeRef = doc(firestore, 'incomes', item.id);
    //   const batch = writeBatch(firestore);
    //   batch.delete(incomeRef);

     
    //     batch.update(userDocRef, {
    //     Incomes: arrayRemove(incomeRef)})
      

    //   this.incomesSubject.next(this.incomesSubject.value.filter((income) => income.id !== item.id));
    //   await batch.commit();
    // } catch (err) {
    //   console.error("Error deleting income:", err);
    // }
  }

  fetchIncomes(uid: string, month: number): Observable<any> {
    return this.http.get<any>(`${environment.incomeUrl}/${uid}/${month}`);
    // try {
    //   const incomesCollection = collection(firestore, 'incomes');
    //   const q = query(incomesCollection, where('userId', '==', uid));

    //   const incomesSnapshot = await getDocs(q);
    //   const incomes: Income[] = [];

    //   for (const doc of incomesSnapshot.docs) {
    //     const incomeData = doc.data() as Income;
    //     if (incomeData.Date.toDate().getMonth() === month) {
    //       incomes.push(incomeData);
    //     }
    //   }
      
    //   return incomes;
    // } catch (err) {
    //   console.log("Error fetching incomes: ", err);
    //   return Promise.reject(err);
    // }
   
  }

  
  
  // getUserTransactionsByDate(
  //   uid: string,
  //   timestamp: Timestamp,
  //   type: 'Expenses' | 'Incomes'
  // ): Promise<(Expense | Income)[]> {
  //   console.log(`Fetching ${type.toLowerCase()} for UID:`, uid);
  //   console.log('Timestamp:', timestamp.toDate());
  
  //   try {
  //     const transactionsCollection = collection(firestore, type.toLowerCase());
  //     const q = query(transactionsCollection, where('userId', '==', uid));
  //     const querySnapshot = await getDocs(q); // Consider getDocsFromCache(q) for performance
  
  //     console.log(`Fetched ${querySnapshot.size} ${type.toLowerCase()}`);
  
  //     const timestampDate = timestamp.toDate();
  //     const transactions = querySnapshot.docs
  //       .map((doc) => doc.data() as Expense | Income)
  //       .filter((data) => {
  //         const dataDate = data.Date.toDate();
  //         return (
  //           dataDate.getFullYear() === timestampDate.getFullYear() &&
  //           dataDate.getMonth() === timestampDate.getMonth() &&
  //           dataDate.getDate() === timestampDate.getDate()
  //         );
  //       });
  
  //     console.log(`${type} for ${uid}:`, transactions);
  
  //     if (type === 'Expenses') {
  //       this.expensesSubject.next(transactions as Expense[]);
  //     } else {
  //       this.incomesSubject.next(transactions as Income[]);
  //     }
  
  //     return transactions;
  //   } catch (error) {
  //     console.error(`Error fetching ${type.toLowerCase()}:`, error);
  //     return Promise.reject(error);
  //   }
  // }

  addIncome(income: Income) {
    return this.http.post<any>(`${environment.incomeUrl}/addIncome`, income);
    // console.log("uid in addIncome:", uid);
  
    // try {
    //   const userDocRef = doc(firestore, 'users', uid);
    //   const incomesCollection = collection(firestore, 'incomes');
  
    //   const batch = writeBatch(firestore);
    //   const incomeDocRef = doc(incomesCollection); // Create a new doc reference
    //   income.id = incomeDocRef.id;
    //   batch.set(incomeDocRef, income); // Add income document
    //   batch.update(userDocRef, {
    //     Incomes: arrayUnion(incomeDocRef) // Append new income reference
    //   });
  
    //   await batch.commit();
    //   this.incomesSubject.next([...this.incomesSubject.value, income]);
    // } catch (error) {
    //   console.log("Error adding income: ", error);
    //   return Promise.reject(error);
    // }
  }

  getIncomes(uid: string): Observable<any> {
    return this.http.get<any>(`${environment.incomeUrl}/all/${uid}`);
  }
}
