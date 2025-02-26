import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Payment } from './models';
import { addDoc, collection, deleteDoc, DocumentReference, getDoc, getDocs, query, Timestamp, updateDoc } from 'firebase/firestore';
import { firestore } from 'firebase.config';
import { where } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  paymentsSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentsSubject.asObservable();
  constructor() { }

  async addPayment(payment: Payment, uid: string) {
    try {
      const paymentsCollection = collection(firestore, 'payments');
      const paymentRef = await addDoc(paymentsCollection, payment);
      console.log("Payment added with ID: ", paymentRef.id);

      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const paymentRefs = userData['Payments'] as DocumentReference[] ?? [];
        paymentRefs.push(paymentRef);
        await updateDoc(doc.ref, { Payments: paymentRefs });
        console.log("Payment Subject exisitng value: ",this.paymentsSubject.value);
        
        this.paymentsSubject.next([...this.paymentsSubject.value, payment]);
      }
    } catch (error) {
      console.log("Error adding payment: ", error);
      
    }
  }

  async getPaymentsByMonth(uid: string, timestamp: Timestamp) : Promise<Payment[]> {
    try {
      console.log("Get payments by month called");
      
     const paymentsCollection = collection(firestore, 'payments');
      const q = query(paymentsCollection, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);

      let payments = querySnapshot.docs.map((doc) => doc.data() as Payment);
      if (payments.length === 0) {
        return [] ;
      }
      payments = payments.filter((p) => p.dueDate.toDate().getMonth() === timestamp.toDate().getMonth());
      this.paymentsSubject.next(payments);

      return payments;
      }
     

     catch (error) {
      console.log("Error fetching payments: ", error);
      return Promise.reject(error); 
      
    }
  }
  async deletePayment(payment: Payment, uid: string) {
    console.log("Payment to be deleted: ",payment);
    console.log("User id: ", uid);
      
    try {
      const paymentsCollection = collection(firestore, 'payments');
      const q = query(paymentsCollection, where('userId', '==', uid), where('description', '==', payment.description));

      console.log("Q:", q);
      
      const querySnapshot = await getDocs(q);
      console.log("Querysnapshot of payments: ", querySnapshot);
      
      const paymentRefs = querySnapshot.docs.map((doc) => doc.ref);
      for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
        this.paymentsSubject.next(this.paymentsSubject.value.filter((p) => p !== payment));
      } 

      const usersCollection = collection(firestore, 'users');
      const qU = query(usersCollection, where('uid', '==', uid));
      const querySnapshotU = await getDocs(qU);

      for (const doc of querySnapshotU.docs) {
        const userData = doc.data();
        let userPayments = userData['Payments'] as DocumentReference[];
       
        
        userPayments = userPayments.filter((p) => 
          !paymentRefs.some((ref) => ref.path === p.path)
        );        await updateDoc(doc.ref, { Payments: userPayments });
        console.log("Payment deleted successfully");
      }
    }
      
    catch (error) {
      console.error("Error deleting payment: ", error);
  }
}
}
