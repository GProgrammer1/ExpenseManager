import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonButton, IonRouterLink, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonLabel
} from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { app } from 'firebase.config';
import { FirestoreService } from '../firestore.service';
import { User } from '../models';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { FcmService } from '../fcm.service';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterLink,IonicModule,
    ReactiveFormsModule]
  
})
export class LoginPage implements OnInit {

  email: string = ''; 
  password: string = '';
  auth!: Auth;

  constructor(private authService: AuthService, private router: Router, private fcmService: FcmService,
    private toastController: ToastController
  ) {
    this.auth = getAuth(app);
  }

  ngOnInit() {
    // Ensure auth state is always checked on initialization
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // If user is already signed in, navigate to the home page
        localStorage.setItem('userId', user.uid);
        this.router.navigate(['/tabs']);
      }
    });
  }

  async login() {
    try {

      
      // Set persistence to local so the session is saved
      await setPersistence(this.auth, browserLocalPersistence);
      // Now perform the sign-in action
      console.log("Password: ", this.password);
      console.log("Email: ", this.email);
      const token = await this.fcmService.getToken();
      console.log("Token: ", token);

      const user = await this.authService.signin(this.email, this.password);
      const userId = user.uid;
      console.log("User ID: ", userId);
      const exists = await this.fcmService.isTokenExists(userId, token!);
      console.log("Token exists: ", exists);
      if (!exists) {
        console.log("Token does not exist, should add it");
        
      await this.fcmService.addToken(userId, token!);
      }
      

      // const fcmToken = await this.fcmService.getToken();
      // if (fcmToken && !await this.fcmService.isTokenExists(userId, fcmToken!)) {
      //     await this.fcmService.addToken(userId, fcmToken!);
      // }
      
      // else if (!fcmToken) {
      //   await this.fcmService.refreshToken();
      //   const newToken = await this.fcmService.getToken();
      //   if (newToken) {
      //     await this.fcmService.addToken(userId, newToken);
      //   }
      // }
      console.log("Token added successfully");
      
        
      localStorage.setItem('userId', userId);
      // After successful login, navigate to the home page
      this.router.navigate(['/tabs']);  
    } catch (error: any) {
      console.error('Error signing in:', error);
  
      const toast = await this.toastController.create({
        message: 'Invalid credentials. Please try again.',
        duration: 3000
      });
      toast.present();
      }
  }

  async refresh() {
    const userId = localStorage.getItem('userId');
    try {
    await this.fcmService.refreshToken();
      const newToken = await this.fcmService.getToken();
      console.log("New token: ", newToken);
      
      if (newToken) {
        await this.fcmService.addToken(userId!, newToken);
        return;
      }
      else {
        this.refresh();
      }
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      alert('Error refreshing token: ' + error.message);
    }
  }
}
