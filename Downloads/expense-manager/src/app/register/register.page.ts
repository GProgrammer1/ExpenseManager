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

  constructor(private authService: AuthService, private firestoreService: FirestoreService,
    private fcmService: FcmService, private router: Router
  ) { }

  ngOnInit() {
  }

  async register() {
   
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    try {
      const authUser =  await this.authService.signup(this.email, this.password);
      const uid = authUser.uid;
     const fcmToken  = await this.fcmService.getToken();
      
      const user : User = {
        uid,
        Email: this.email,
        Password: this.password,
        Budgets: [],Expenses: [], Incomes: [], Payments: [],
        Name: this.name, fcmTokens: [fcmToken!]
        
      }
      await this.firestoreService.addUser(user);
      alert('User signed up successfully');
      this.router.navigate(['/tabs']);
      
    }
    catch (error: any) {
      alert('Error signing up: ' + error.message);
    }
  }

}
