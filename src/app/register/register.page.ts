import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { User } from '../models';
import { RouterLink } from '@angular/router';
import { FcmService } from '../services/fcm.service';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink, ReactiveFormsModule],

})
export class RegisterPage implements OnInit {

  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  fcmToken: string | null = '' ;
  redirecting = false;
  passwordType: string = 'password';
  confirmPasswordType: string = 'password';

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password';
  }
  constructor(private authService: AuthService, private firestoreService: FirestoreService,
    private fcmService: FcmService, private router: Router, private toastController: ToastController
  ) { }

 async  ngOnInit() {
    this.fcmToken  = await this.fcmService.getToken();
    localStorage.setItem('fcmToken', this.fcmToken!);

  }

  async register() {
    this.redirecting = true;

    if (this.password !== this.confirmPassword) {
      const toast = await this.toastController.create({
        message: 'Passwords do not match. Please try again.',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      this.redirecting = false;

      toast.present();
      return;
    }
  
      this.authService.signup(this.email, this.password, this.name, this.fcmToken!).subscribe({
        next: (res: any) => {
          this.redirecting = false;
          const user = res.user;
          const uid = user.uid;
          localStorage.setItem('userId', uid);
          this.router.navigate(['/personalinfo']);
        },
        error: async (error) => {
          this.redirecting = false;
          console.error('Error registering user:', error);
          let errorMessage = 'An error occurred. Please try again.';
      
          if (error.code) {
            switch (error.code) {
              case 'auth/email-already-in-use':
                errorMessage = 'Email is already in use. Try another one.';
                break;
              case 'auth/weak-password':
                errorMessage = 'Password is too weak. Use a stronger password.';
                break;
              case 'auth/invalid-email':
                errorMessage = 'Invalid email format. Please check your email.';
                break;
              case 'auth/network-request-failed':
                errorMessage = 'Network error. Check your connection.';
                break;
              default:
                errorMessage = error.message || 'Registration failed. Try again.';
            }
          }
      
          const toast = await this.toastController.create({
            message: errorMessage,
            duration: 3000,
            color: 'danger',
            position: 'top'
          });
          toast.present();
        }
      });
  
  }
  
  

}
