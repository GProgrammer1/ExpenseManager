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
    // try {
    //   const subscriptionsCollection = collection(firestore, 'subscriptions');
    //   const q = query(subscriptionsCollection, where('userId', '==', uid));
    //   const querySnapshot = await getDocs(q);
  
    //   const subscriptions = querySnapshot.docs.map(doc => doc.data() as Subscription);
  
    //   this.subscriptionsSubject.next(subscriptions);
    //   return subscriptions;
    // } catch (error) {
    //   console.error("Error getting subscriptions: ", error);
    //   throw error; // No need for reject; `` functions naturally reject on errors
    // }
  }
  

   deleteSubscription(subscription: Subscription) {
    const subscriptionId = subscription.id;
    return this.http.delete<any>(`${environment.subscriptionUrl}/${subscriptionId}`);
    // try {
    //   const uid = subscription.userId;
    //   const userDocRef = doc(firestore, 'users', uid);  
    //   // Query for the subscription document
    //   const subscriptionRef = doc(firestore, 'subscriptions', subscription.id);  
    //     const batch = writeBatch(firestore);
    //     batch.delete(subscriptionRef);

       
    //     batch.update(userDocRef, {Subscriptions: arrayRemove(subscriptionRef)});

    //     await batch.commit();
    //     this.subscriptionsSubject.next(this.subscriptionsSubject.value.filter((sub) => sub.id !== subscription.id));
     
    // } catch (error) {
    //   console.error("Error deleting subscription: ", error);
    // }
  }

  addSubscription(subscription: Subscription) {

    return this.http.post<any>(`${environment.subscriptionUrl}/addSubscription`, subscription);
    // try {
    //   const uid = subscription.userId;
    //   const userDocRef = doc(firestore, 'users', uid);
    //   const subscriptionsCollection = collection(firestore, 'subscriptions');
  
    //   const batch = writeBatch(firestore);
    //   const subscriptionDocRef = doc(subscriptionsCollection); // Create a new doc reference
    //   subscription.id = subscriptionDocRef.id;
    //   batch.set(subscriptionDocRef, subscription); // Add subscription document
    //   batch.update(userDocRef, {
    //     Subscriptions: arrayUnion(subscriptionDocRef) // Append new subscription reference
    //   });
  
    //   await batch.commit();
  
    //   this.subscriptionsSubject.next([...this.subscriptionsSubject.value, subscription]);
    // } catch (error) {
    //   console.error("Error adding subscription: ", error);
    //   return Promise.reject(error);
    // }
  }
  
}
