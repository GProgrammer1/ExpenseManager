import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FcmService } from '../services/fcm.service';
import { ToastController } from '@ionic/angular';
import { catchError, of, Subscription, switchMap, tap } from 'rxjs';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonicModule, ReactiveFormsModule],
})
export class LoginPage implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  auth!: Auth;
  passwordType: 'password' | 'text' = 'password';
  redirecting = false;
  token: string | null = '';
  loginSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fcmService: FcmService,
    private toastController: ToastController,
  ) {
    this.auth = getAuth();
    this.fetchToken();
  }

  async fetchToken() {
    this.token = await this.fcmService.getToken();
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
      this.loginSubscription = this.authService.signin(this.email, this.password)
        .pipe(
          switchMap((res: any) => {
            const userId = res.uid;
            localStorage.setItem('userId', userId);
            return this.fcmService.isTokenExists(userId!, this.token!).pipe(
              switchMap((exists: boolean) => {
                if (!exists) {
                  return this.fcmService.addToken(userId!, this.token!).pipe(
                    tap(() => {
                      setPersistence(this.auth, browserLocalPersistence)
                        .then(() => {
                          this.router.navigate(['/tabs']);
                        })
                        .catch((error) => {
                          this.redirecting = false;
                        });
                    })
                  );
                }
                setPersistence(this.auth, browserLocalPersistence)
                  .then(() => {
                    this.router.navigate(['/tabs']);
                  })
                  .catch((error) => {
                    this.redirecting = false;
                  });
                return of(null); // Return an observable to complete the chain
              })
            );
          }),
          catchError(async (err) => {
            this.redirecting = false;
            const toast = await this.toastController.create({
              message: 'Invalid credentials. Please try again.',
              duration: 3000,
              position: 'top',
              color: 'danger',
            });
            toast.present();
            return of(null); // Continue execution after error
          })
        )
        .subscribe(() => {
          this.redirecting = false;
        });
    } catch (error) {
      this.redirecting = false;
    }
  }
}