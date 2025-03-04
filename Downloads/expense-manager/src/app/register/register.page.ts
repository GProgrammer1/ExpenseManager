import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { FirestoreService } from '../firestore.service';
import { User } from '../models';
import { RouterLink } from '@angular/router';
import { FcmService } from '../fcm.service';
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

  }

  async register() {
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
      const toast = await this.toastController.create({
        message: 'Passwords do not match. Please try again.',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      toast.present();
      return;
    }
  
    try {
      const authUser = await this.authService.signup(this.email, this.password);
      const uid = authUser.uid;
      console.log("NEW USER ID: ", uid);
  
      localStorage.setItem('userId', uid);
  
      const user: User = {
        uid: uid,
        Email: this.email,
        Password: this.password,
        Budgets: [], Expenses: [], Incomes: [], Payments: [], Goals: [], Subscriptions: [],
        Name: this.name, fcmTokens: [this.fcmToken!],
        variableExpenses: [], fixedExpenses: [], hasDebt: false,
        savingsGoal: 0, ageRange: '', country: '', savings: 0, monthlyIncome: 0, city: '', occupation: ''
      };
  
      console.log('New user object:', user);
      
      await this.firestoreService.addUser(user);
      this.router.navigate(['/personalinfo']);
      
    } catch (error: any) {
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
  }
  
  

}
