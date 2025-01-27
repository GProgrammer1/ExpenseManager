import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { FirestoreService } from '../firestore.service';
import { User } from '../models';
import { RouterLink } from '@angular/router';

import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],

})
export class RegisterPage implements OnInit {

  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private authService: AuthService, private firestoreService: FirestoreService) { }

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
     const {value} = await  SecureStoragePlugin.get({key: 'device_id'});
      console.log(value);

    
      const fcmToken = await this.firestoreService.getFcmToken(value!);
      console.log(fcmToken);
      
      const user : User = {
        uid,
        Email: this.email,
        Password: this.password,
        Budgets: [],Expenses: [], Incomes: [], Payments: [],
        Name: this.name, fcmToken
        
      }
      await this.firestoreService.addUser(user);
      alert('User signed up successfully');
      
      
    }
    catch (error: any) {
      alert('Error signing up: ' + error.message);
    }
  }

}
