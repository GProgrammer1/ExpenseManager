import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput,IonButton, IonSelect,
  IonSelectOption
 } from '@ionic/angular/standalone';
import {IonicModule} from '@ionic/angular';
import { Timestamp } from 'firebase/firestore';
import { Expense } from '../models';
import { BudgetService } from '../services/budget.service';
import { Router, RouterLink } from '@angular/router';
import { ExpenseService } from '../services/expense.service';
import { time } from 'ionicons/icons';
@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.page.html',
  styleUrls: ['./add-expense.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule,
     FormsModule, RouterLink ]
})
export class AddExpensePage  {

  amount: number | null = null;
  expense_categories: string[] = ['Food', 'Transportation', 'Entertainment', 'Health', 'Education', 'Other','Housing', 'Utilities',
    'Clothing', 'Insurance', 'Personal Care'
  ];
  categ: string = '';
  description: string = '';
  selectedDate: string = new Date().toISOString();
  @ViewChild('select') select!: IonSelect;
  
  constructor( private budgetService: BudgetService,
    private router: Router, private expenseService: ExpenseService
  ) { }

  openSelect() {
    this.select.open();
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
      id: '',

      date: Timestamp.fromDate(new Date(this.selectedDate)),
      description: this.description,
      category: this.categ,
      amount: this.amount!,
      userId: userId!
    }
    console.log("Expense date: ", expense.date.toDate().toISOString());
    
    
    this.expenseService.addExpense(expense).subscribe(
      {
        next: (data) => {
          console.log("Expense added successfully", data);
          const expense = data.expense;
          
          this.expenseService.expenseSubject.next([...this.expenseService.expenseSubject.value, expense]);
          const spending : {category: string, amount: number} = {category: expense.category, amount: expense.amount};
          const timestamp = new Timestamp(expense.date.seconds, expense.date.nanoseconds);
          this.budgetService.signalChange('Expense', spending, timestamp.toDate().getMonth() + 1);

          this.router.navigate(['/tabs/transactions']);
        },
        error: (err) => {
          console.error("Error adding expense", err);
        }
      }
    );
  }
}
