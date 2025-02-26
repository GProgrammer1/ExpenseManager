import { Injectable } from '@angular/core';
import {PushNotifications} from '@capacitor/push-notifications';
import { firestore } from 'firebase.config.js';
import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  constructor() { }

  async requestPermission() {
    let permStatus = await PushNotifications.requestPermissions();
    return permStatus.receive === 'granted';
  }

  async getToken(): Promise<string | null> {
    try {
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        console.warn('Push Notification permission not granted');
        return null;
      }

      await PushNotifications.register();

      return new Promise<string | null>((resolve) => {
        PushNotifications.addListener('registration', (token) => {
          console.log('FCM Token:', token.value);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error during registration', error);
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Error getting FCM token', error);
      return null;
    }
  }

  async isTokenExists(uid: string, fcmToken: string) : Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid','==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data() as import('./models.ts').User;
        let fcmTokens = userData['fcmTokens'];
        if (fcmTokens.some(token => token === fcmToken)) {
          resolve(true);
        }
      }

      resolve(false);
    }
    catch (ex) {
      reject(ex);
    }
    })
    
  }

  async addToken(uid: string, fcmToken: string) {
    try {
      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid','==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data() as import('./models.ts').User;
        await updateDoc(doc.ref, {fcmTokens: [...userData.fcmTokens, fcmToken]});
        return;
      }
    } catch(ex) {
      console.log("Error adding token: ", ex);
      Promise.reject(ex);
      
    }
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

  async removeToken(uid: string, fcmToken: string) {
    try {
      const usersCollection = collection(firestore, 'users');
      const q = query(usersCollection, where('uid','==', uid));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const userData = doc.data() as import('./models.ts').User;
        await updateDoc(doc.ref, {fcmTokens: userData.fcmTokens.filter(token => token !== fcmToken)});
        return;
      }
    } catch(ex) {
      console.log("Error removing token: ", ex);
      Promise.reject(ex);
    }
  }
}
