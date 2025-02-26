import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput,IonButton, IonSelect,
  IonSelectOption
 } from '@ionic/angular/standalone';
import {IonicModule} from '@ionic/angular';
import { Timestamp } from 'firebase/firestore';
import { Expense } from '../models';
import { FirestoreService } from '../firestore.service';
import { BudgetService } from '../budget.service';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.page.html',
  styleUrls: ['./add-expense.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule,
     FormsModule, RouterLink ]
})
export class AddExpensePage implements OnInit {

  amount: number | null = null;
  expense_categories: string[] = ['Food', 'Transportation', 'Entertainment', 'Health', 'Education', 'Other','Housing'];
  categ: string = '';
  description: string = '';
  selectedDate: string = new Date().toISOString().split('T')[0];
  
  constructor(private firestoreService: FirestoreService, private budgetService: BudgetService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  add() {

    const userId = localStorage.getItem('userId');
    console.log("Adding expense");

    if(!this.amount) {
      alert('Please enter a valid amount');
      return;
    }
    if (isNaN(this.amount!) || this.amount! < 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!this.categ || !this.description) {
      alert('Please fill in all fields');
      return;
    }
    const expense: Expense = {

      Date: Timestamp.fromDate(new Date()),
      Description: this.description,
      Category: this.categ,
      Amount: this.amount!,
      userId: userId!
    }
    
    this.firestoreService.addExpense(userId!, expense);
    this.budgetService.signalChange('Expense');
    this.router.navigate(['/tabs/transactions']);
  }
}
