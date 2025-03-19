import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {PushNotifications} from '@capacitor/push-notifications';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.js';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor(private http: HttpClient) { }

  async requestPermission() {
    let permStatus = await PushNotifications.requestPermissions();
    return permStatus.receive === 'granted';
  }

  async getToken(): Promise<string | null> {
    try {  
      if (!(await this.requestPermission())) {
        console.warn("Push Notification permission not granted");
        return null;
      }
  
      await PushNotifications.register();
  
      return new Promise<string | null>((resolve) => {
        const onRegistration = (token: { value: string }) => {
          console.log("FCM Token:", token.value);
          PushNotifications.removeAllListeners();
          resolve(token.value);
        };
  
        const onError = (error: any) => {
          console.error("Error during registration", error);
          PushNotifications.removeAllListeners();
          resolve(null);
        };
  
        PushNotifications.addListener("registration", onRegistration);
        PushNotifications.addListener("registrationError", onError);
      });
    } catch (error) {
      console.error("Error getting FCM token", error);
      return null;
    }
  }
  
  isTokenExists(uid: string, fcmToken: string) : Observable<any> {
    
    return this.http.get(`${environment.fcmUrl}/exists/${uid}/${fcmToken}`);
    
  }

  addToken(uid: string, fcmToken: string) {
    return this.http.post<any>(`${environment.fcmUrl}/add`, {uid, fcmToken});
  }

  async refreshToken() {
    try {
      await PushNotifications.requestPermissions();
      const newToken = await PushNotifications.register();
      console.log("New FCM Token:", newToken);
    } catch (error) {
      console.error("Error refreshing FCM token:", error);
    }
  }

  removeToken(uid: string, fcmToken: string) {
    return this.http.delete<any>(`${environment.fcmUrl}/remove/${uid}/${fcmToken}`);
  }
}
