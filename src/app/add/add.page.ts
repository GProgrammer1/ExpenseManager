import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirestoreService } from '../firestore.service';
import { IonicModule } from '@ionic/angular';
import { Budget, Expense, Income, Payment } from '../models';
import { AuthService } from '../auth.service';
import { Timestamp } from 'firebase/firestore';
import { Router } from '@angular/router';
import {IonGrid} from '@ionic/angular';
import { BudgetService } from '../budget.service';
import { Observable } from 'rxjs';
import { PaymentService } from '../payment.service';
@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, CommonModule, ReactiveFormsModule]
})
export class AddPage implements OnInit, AfterViewInit {
payments$: Observable<Payment[]> | undefined;
checkIfSelected(category: string) {
  return this.rows.some(row => row.categ === category);
}
  expense_categories : string[] = []; 
  income_categories : string[] = [];
  selectedData!: 'Expense' | 'Income' | 'Budget' | 'Payment';
  date: string;
  description: any;
  categ: any;
  selectedMonth: number = 1; 
  amount: number | null = 0;
  userId!: string;
  minDate = new Date().toISOString().split('T')[0];
  user$ = this.firestoreService.user$; 
  @ViewChild('grid', {static: false}) grid!: ElementRef;
  months = [1,2,3,4,5,6,7,8,9,10,11,12];

  ngAfterViewInit() {
    if (this.grid && this.grid.nativeElement) {
      console.log('Grid Element:', this.grid.nativeElement);
    }
  }
  
  rows!: { categ: string, amount: number }[] ;

  addRow() {
    if (!this.categ || this.amount === null) {
      alert('Please fill in both Category and Amount.');
      return;
    }

    // Add the new row to the rows array
    this.rows.push({ categ: this.categ, amount: this.amount });

    // Reset the input fields
    this.categ = '';
    this.amount = null;
  }

  constructor(private firestoreService: FirestoreService, private authService: AuthService,
     private router: Router, private budgetService: BudgetService, private paymentService: PaymentService) {
      this.selectedData = 'Expense';
    this.date = new Date().toISOString().split('T')[0];
    this.user$.subscribe((user) => {
      if (user) {
        this.userId = user.uid;
      }
    })
   }

 async ngOnInit() {
  this.rows = []; 
  try {
    this.expense_categories = await this.firestoreService.getCategories('Expense');
    this.income_categories = await this.firestoreService.getCategories('Income');
    console.log("Categories: ", this.expense_categories);
    
  }
  catch (error) {
    console.log("Error getting categories: ", error);
  }
}

formatTime() {
  const date = new Date();
  return String(date.getDay()).padStart(2, '0') + '/' + String(date.getMonth()).padStart(2, '0') + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
}

add(){
  console.log("Selected category: ", this.categ);
  let userId = this.userId ?? localStorage.getItem('userId');
  if (this.selectedData === 'Expense') {
    console.log("Adding expense");
    console.log("Date: ", this.date);
    console.log("Type of date:", typeof this.date);

    const expense: Expense = {

      Date: Timestamp.fromDate(new Date(this.date)),
      Description: this.description,
      Category: this.categ,
      Amount: this.amount!,
      userId: userId
    }
    
    this.firestoreService.addExpense(userId, expense);
    this.budgetService.signalChange('Expense');
    this.router.navigate(['/tabs']);
  }

  else if (this.selectedData === 'Income') {
    console.log("Adding income");
    
    console.log("Date: ", this.date);
    console.log("Type of date:", typeof this.date);
    
    
    const income: Income = {
      Date: Timestamp.fromDate(new Date(this.date)),
      Description: this.description,
      Category: this.categ,
      Amount: this.amount!,
      userId: userId
    }
        
    this.firestoreService.addIncome(userId, income);
    this.budgetService.signalChange('Income');
    this.router.navigate(['/tabs']);
  }

  else if(this.selectedData === 'Budget'){
    let spendings : {[key:string]: number} = {};    
    let totalBudget = 0;
    this.rows.forEach(row => {
      spendings[row.categ] = row.amount;
      totalBudget += row.amount;
    });
    console.log("Spendings: ", spendings);
    console.log("Total Budget: ", totalBudget);
    console.log("Selected month: ", this.selectedMonth);
    
    
    let budget :Budget = {
      spendings,
      month: this.selectedMonth,
      totalBudget,
      userId: userId
    };

    console.log("Budget: ", budget);

    this.budgetService.addBudget(userId!, budget);
    this.router.navigate(['/tabs']);
  }

  else{ 
    console.log("Adding payment");
    
    console.log("Date: ", this.date);
    console.log("Type of date:", typeof this.date);
    
    
    const payment: Payment = {
      amount: this.amount!,
      dueDate: Timestamp.fromDate(new Date(this.date)),
      description: this.description,
      userId: userId

    }
    
    this.paymentService.addPayment(payment, userId);
    this.router.navigate(['/tabs']);
  }
}

typeMonth() {
  console.log("Selected month:", this.selectedMonth);
  
}

}
