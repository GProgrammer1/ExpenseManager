import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Payment } from './models';
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, DocumentReference, getDoc, getDocs, query, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from 'firebase.config';
import { where } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  paymentsSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentsSubject.asObservable();

  constructor() {}

  async addPayment(payment: Payment, uid: string) {
    try {
      const batch = writeBatch(firestore);

      const paymentsCollection = collection(firestore, 'payments');
      const paymentRef = doc(paymentsCollection);
      batch.set(paymentRef, payment);
      payment.id = paymentRef.id;

      const userDocRef = doc(firestore, 'users', uid);
    
     batch.update(userDocRef, { Payments: arrayUnion(paymentRef) });


      await batch.commit();
      this.paymentsSubject.next([...this.paymentsSubject.value, payment]);
      console.log('Payment added with batching:', paymentRef.id);
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  }

  async getPayments(uid: string): Promise<Payment[]> {
    try {
      const paymentsCollection = collection(firestore, 'payments');
      const q = query(paymentsCollection, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      
      let payments = querySnapshot.docs.map(doc => doc.data() as Payment);
      return payments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return Promise.reject(error);
    }
  }

  async deletePayment(payment: Payment, uid: string) {
    try {
      const batch = writeBatch(firestore);
      const paymentRef = doc(firestore, 'payments', payment.id);
      batch.delete(paymentRef);
      const userDocRef = doc(firestore, 'users', uid);
      batch.update(userDocRef, { Payments: arrayRemove(paymentRef) });
      await batch.commit();
      console.log('Payment deleted with batching:', payment.id);
      this.paymentsSubject.next(this.paymentsSubject.value.filter(p => p.id !== payment.id));
      return;
 
      
    } catch (error) {
      console.error('Error deleting payment:', error);
    }

  }
}