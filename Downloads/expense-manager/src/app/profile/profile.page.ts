import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../auth.service';
import { FirestoreService } from '../firestore.service';
import { User } from '../models';
import {IonicModule} from '@ionic/angular';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {

  user!: User;
  editableUser!: User;
  isEditing = false;
  isSaving = false;

  fixedExpensesRows : {category: string, amount: number}[] = [];
  variableExpensesRows : {category: string, amount: number}[] = [];
  constructor(private firestoreService: FirestoreService, private authService: AuthService) { }

  ngOnInit() {
    this.fetchUser();
  }

  async fetchUser() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const userData = await this.firestoreService.getUserByuid(userId);
      this.user = userData;
      this.fixedExpensesRows = this.user.fixedExpenses;
      this.variableExpensesRows = this.user.variableExpenses;
      this.editableUser = { ...this.user }; // Create a copy for editing
    }
  }

  removeFixedExpense(index: number) {
    this.editableUser.fixedExpenses.splice(index, 1);
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.editableUser = { ...this.user }; // Reset changes on cancel
    }
  }

  async saveProfile() {
    this.isSaving = true;
    try {
      await this.authService.updateUserData(this.editableUser.uid, this.editableUser);
      console.log("Profile updated successfully");
      this.user = { ...this.editableUser }; // Update the user object
      this.isEditing = false;
      
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      this.isSaving = false;
    }
  }

  addFixedExpense() {
    this.editableUser.fixedExpenses.push({ category: '', amount: 0 });
  }

  removeVariableExpense(index: number) {
    this.editableUser.variableExpenses.splice(index, 1);
  }

  addVariableExpense() {
    this.editableUser.variableExpenses.push({ category: '', amount: 0 });
  }
}
