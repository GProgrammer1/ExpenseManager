import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { User as AppUser } from '../models';
import {IonicModule, AlertController, NavController} from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { FcmService } from '../services/fcm.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class ProfilePage implements OnInit {

  user!: AppUser;
  editableUser!: AppUser;
  isEditing = false;
  isSaving = false;

  fixedExpensesRows : {category: string, amount: number}[] = [];
  variableExpensesRows : {category: string, amount: number}[] = [];
  constructor( private authService: AuthService, private alertController: AlertController, private router: Router,
    private fcmService: FcmService, private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.fetchUser();
  }

  async fetchUser() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.authService.getUserByuid(userId).subscribe({
        next: (user: AppUser) => {
          this.user = user;
          console.log('User fetched:', this.user);
          
          this.fixedExpensesRows = this.user.fixedExpenses;
          this.variableExpensesRows = this.user.variableExpenses;
          this.editableUser = JSON.parse(JSON.stringify(user)); // Create a copy for editing
          console.log("Editable user created: ", this.editableUser);
          
        },
        error: (err) => {
          console.error('Error fetching user:', err);
        }
      });
      
    }
  }

  removeFixedExpense(index: number) {
    this.editableUser.fixedExpenses.splice(index, 1);
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      
      this.editableUser = JSON.parse(JSON.stringify(this.user)); // Reset changes on cancel
      console.log("Resetting changes: ", this.editableUser);
      
      this.fixedExpensesRows = this.editableUser.fixedExpenses;
      this.variableExpensesRows = this.editableUser.variableExpenses;

    }
  }

  async saveProfile() {
    this.isSaving = true;
   
      this.authService.updateUserData(this.editableUser.id, this.editableUser).subscribe({
        next: (user: AppUser )=> {
          this.isSaving = false;
          this.user = JSON.parse(JSON.stringify(this.editableUser)); // Update the user object
          console.log('User parsed:', this.user);
          
          this.isEditing = false;
          console.log("Profile updated successfully");

        },
        error: (err: any) => {
          console.error('Error updating user:', err);
          this.isSaving = false;
          console.log("Error updating profile");
        }
      });
  }
  async signout() {

    localStorage.removeItem('userId');
    
    this.authService.signout(this.user.id).pipe(
      switchMap((message) => this.fcmService.removeToken(this.user.id!, localStorage.getItem('fcmToken')!))
    ).subscribe({
      next: (res: any) => {
        console.log("User signed out: ", res);
        localStorage.removeItem('fcmToken');
        this.navCtrl.navigateRoot('/login', {replaceUrl: true});
      },
      error: (err) => {
        console.error("Error signing out:", err);
      }
    }
    );
    
  }

  async presentSignoutDialog() {
  
    const alert = await this.alertController.create({
      header: 'Sign out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Sign out canceled');
          }
        },
        {
          text: 'Sign out',
          role: 'destructive',
          handler: () => {
            console.log('User signed out');
            this.signout();
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  
  addFixedExpense() {
    console.log("Editable user fixed expenses: ", this.editableUser.fixedExpenses);
    
    this.editableUser.fixedExpenses.push({ category: '', amount: 0 });
  }

  removeVariableExpense(index: number) {
    this.editableUser.variableExpenses.splice(index, 1);
  }

  addVariableExpense() {
    this.editableUser.variableExpenses.push({ category: '', amount: 0 });
  }
}
