import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';

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
}
