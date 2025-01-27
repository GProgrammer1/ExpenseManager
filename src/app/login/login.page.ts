import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { app } from 'firebase.config';
import { FirestoreService } from '../firestore.service';
import { User } from '../models';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class LoginPage implements OnInit {

  email: string = ''; 
  password: string = '';
  auth!: Auth;

  constructor(private authService: AuthService, private router: Router, private firestoreService: FirestoreService) {
    this.auth = getAuth(app);
  }

  ngOnInit() {
    // Ensure auth state is always checked on initialization
    // onAuthStateChanged(this.auth, (user) => {
    //   if (user) {
    //     localStorage.setItem('userId', user.uid);
    //     // If a user is logged in, navigate to the home page immediately
    //     this.router.navigate(['/tabs']);
    //   }
    // });
  }

  async login() {
    try {

      
      // Set persistence to local so the session is saved
      await setPersistence(this.auth, browserLocalPersistence);
      // Now perform the sign-in action
     
      const user = await this.authService.signin(this.email, this.password);

      const userId = user.uid;
      localStorage.setItem('userId', userId);
      // After successful login, navigate to the home page
      this.router.navigate(['/tabs']);  
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert('Error signing in: ' + error.message);
    }
  }
}
