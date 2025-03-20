import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Subscription } from '../models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  subscriptionSubject = new BehaviorSubject<Subscription[]>([]);
  subscriptions$ = this.subscriptionSubject.asObservable();
  constructor(private http: HttpClient) { }

  getUserSubscriptions(uid: string): Observable<any> {
    return this.http.get<any>(`${environment.subscriptionUrl}/${uid}`);
    
  }
  

   deleteSubscription(subscription: Subscription) {
    const subscriptionId = subscription.id;
    return this.http.delete<any>(`${environment.subscriptionUrl}/${subscriptionId}`);
   
  }

  addSubscription(subscription: Subscription) {

    return this.http.post<any>(`${environment.subscriptionUrl}/addSubscription`, subscription);
  
  }
  
}
