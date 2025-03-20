import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Payment } from '../models';

import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  paymentSubject = new BehaviorSubject<Payment[]>([]);
  payments$ = this.paymentSubject.asObservable();

  constructor(private http: HttpClient) {}

  addPayment(payment: Payment, uid: string) {
    return this.http.post<any>(`${environment.paymentUrl}/addPayment`, payment);
   
  }

  getPayments(uid: string){
    return this.http.get<any>(`${environment.paymentUrl}/${uid}`);
   
  }

  deletePayment(payment: Payment) {  
    const paymentId = payment.id;
    return this.http.delete<any>(`${environment.paymentUrl}/${paymentId}`);
  }
}