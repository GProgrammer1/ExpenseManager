import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FcmService } from '../services/fcm.service';
import { ToastController } from '@ionic/angular';
import { catchError, of, Subscription, switchMap, tap } from 'rxjs';
import { JwtService } from '../services/jwt.service';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, RouterLink,IonicModule,
    ReactiveFormsModule]
  
})
export class LoginPage implements OnInit, OnDestroy {

  email: string = ''; 
  password: string = '';
  auth!: Auth;
  passwordType: 'password' | 'text'= 'password';
  redirecting = false;
  token: string | null = '';
  loginSubscription: Subscription | null = null;
  constructor(private authService: AuthService, private router: Router, private fcmService: FcmService,
    private toastController: ToastController, private jwtService: JwtService
  ) {
    this.auth = getAuth();
    this.fetchToken();
  }

  async fetchToken() {
    this.token = await this.fcmService
      .getToken();
    console.log("FCM TOKEN IN FETCH TOKEN Token: ", this.token);
    localStorage.setItem('fcmToken', this.token!);
      
  }

  ngOnInit() {
    // Ensure auth state is always checked on initialization
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  async login() {
    this.redirecting = true;
    try {
      console.log("Password: ", this.password);
      console.log("Email: ", this.email);

  
      this.loginSubscription = this.authService.signin(this.email, this.password).pipe(
        switchMap((res: any) => {
          console.log("Response: ", res);

          console.log("FCM token: ", this.token);
          const userId = res.uid;
          localStorage.setItem('userId', userId);
          return this.fcmService.isTokenExists(userId!, this.token!).pipe(
            switchMap((exists: boolean) => {
              if (!exists) {
                console.log("Token does not exist, adding it...");
                return this.fcmService.addToken(userId!, this.token!).pipe(
                  tap(() => {
                    console.log("Token added successfully");
                    setPersistence(this.auth, browserLocalPersistence)
              .then(() => {
                console.log("Persistence set to LOCAL");
              })
              .catch((error) => {
                this.redirecting = false;
                console.error("Error setting persistence:", error);
              });
              console.log("Navigating to tabs");
              
              this.router.navigate(['/tabs']);
                  })
                );
              }
              console.log("Token exists");
              setPersistence(this.auth, browserLocalPersistence)
              .then(() => {
                console.log("Persistence set to LOCAL");
              })
              .catch((error) => {
                console.error("Error setting persistence:", error);
              });
              console.log("Navigating to tabs");
              
              this.router.navigate(['/tabs']);
              return of(null); // Return an observable to complete the chain
            })
          );
        }),
        catchError(async (err) => {
          console.error('Error signing in:', err);
          this.redirecting = false;
          const toast = await this.toastController.create({
            message: 'Invalid credentials. Please try again.',
            duration: 3000,
            position: 'top',
            color: 'danger'
          });
          toast.present();
          return of(null); // Continue execution after error
        })
      ).subscribe(() => {
        this.redirecting = false;
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      this.redirecting = false;
    }
  }
}
