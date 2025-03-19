import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Payment } from '../models';

import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
//TODO: VALIDATION AND EXCEPTION HANDLING MEANING RETURN DIFFERENT HTTP STATUS CODES FOR DIFFERENT SCENARIOS
//{400, 401, 403, 404, 500}
@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  paymentSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentSubject.asObservable();

  constructor(private http: HttpClient) {}

  addPayment(payment: Payment, uid: string) {
    return this.http.post<any>(`${environment.paymentUrl}/addPayment`, payment);
    // try {
    //   const batch = writeBatch(firestore);

    //   const paymentsCollection = collection(firestore, 'payments');
    //   const paymentRef = doc(paymentsCollection);
    //   batch.set(paymentRef, payment);
    //   payment.id = paymentRef.id;

    //   const userDocRef = doc(firestore, 'users', uid);
    
    //  batch.update(userDocRef, { Payments: arrayUnion(paymentRef) });


    //   await batch.commit();
    //   this.paymentsSubject.next([...this.paymentsSubject.value, payment]);
    //   console.log('Payment added with batching:', paymentRef.id);
    // } catch (error) {
    //   console.error('Error adding payment:', error);
    // }
  }

  getPayments(uid: string){
    return this.http.get<any>(`${environment.paymentUrl}/${uid}`);
    // try {
    //   const paymentsCollection = collection(firestore, 'payments');
    //   const q = query(paymentsCollection, where('userId', '==', uid));
    //   const querySnapshot = await getDocs(q);
      
    //   let payments = querySnapshot.docs.map(doc => doc.data() as Payment);
    //   return payments;
    // } catch (error) {
    //   console.error('Error fetching payments:', error);
    //   return Promise.reject(error);
    // }
  }

  deletePayment(payment: Payment, uid: string) {  
    const paymentId = payment.id;
    return this.http.delete<any>(`${environment.paymentUrl}/${paymentId}`);

    // try {
    //   const batch = writeBatch(firestore);
    //   const paymentRef = doc(firestore, 'payments', payment.id);
    //   batch.delete(paymentRef);
    //   const userDocRef = doc(firestore, 'users', uid);
    //   batch.update(userDocRef, { Payments: arrayRemove(paymentRef) });
    //   await batch.commit();
    //   console.log('Payment deleted with batching:', payment.id);
    //   this.paymentsSubject.next(this.paymentsSubject.value.filter(p => p.id !== payment.id));
    //   return;
 
      
    // } catch (error) {
    //   console.error('Error deleting payment:', error);
    // }

  }
}