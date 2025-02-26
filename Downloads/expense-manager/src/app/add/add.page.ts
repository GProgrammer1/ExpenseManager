// import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
// import { FirestoreService } from '../firestore.service';
// import { IonicModule } from '@ionic/angular';
// import { Budget, Expense, Income, Payment } from '../models';
// import { AuthService } from '../auth.service';
// import { Timestamp } from 'firebase/firestore';
// import { ActivatedRoute, Router } from '@angular/router';
// import {IonGrid} from '@ionic/angular';
// import { BudgetService } from '../budget.service';
// import { Observable } from 'rxjs';
// import { PaymentService } from '../payment.service';
// @Component({
//   selector: 'app-add',
//   templateUrl: './add.page.html',
//   styleUrls: ['./add.page.scss'],
//   standalone: true,
//   imports: [IonicModule, CommonModule, FormsModule, CommonModule, ReactiveFormsModule]
// })
// export class AddPage implements OnInit, AfterViewInit {
// payments$: Observable<Payment[]> | undefined;

//   expense_categories : string[] = []; 
//   income_categories : string[] = [];
//   types: string[] = ['Expense', 'Income', 'Budget', 'Payment'];
//   selectedData!: 'Expense' | 'Income' | 'Budget' | 'Payment' | string;
//   date: string;
//   tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().toLocaleLowerCase().split('t')[0];
//   description: any;
//   paymentVar = this.tomorrow;
//   categ: any;
//   selectedMonth: number = 1; 
//   amount: number | null = 0;
//   userId!: string;
//   minDate = new Date().toISOString().toLocaleLowerCase().split('t')[0];
//   user$ = this.firestoreService.user$; 
//   @ViewChild('grid', {static: false}) grid!: ElementRef;
//   months = [1,2,3,4,5,6,7,8,9,10,11,12];
//   selectedDate: string; 
//   ngAfterViewInit() {
//     if (this.grid && this.grid.nativeElement) {
//       console.log('Grid Element:', this.grid.nativeElement);
//     }
//   }
  
//   rows!: { categ: string, amount: number }[] ;

 
 

//   constructor(private firestoreService: FirestoreService, private authService: AuthService,
//      private router: Router, private budgetService: BudgetService,
//       private paymentService: PaymentService, private route: ActivatedRoute) {
//         console.log("Selected date:", this.route.snapshot.paramMap.get('date'));
        
//         this.selectedDate = this.route.snapshot.paramMap.get('date') || new Date().toISOString().split('T')[0];
//         console.log("Received or default date:", this.selectedDate);
//       this.rows = [];
//       this.selectedData = 'Expense';
//     this.date = new Date().toISOString().toLocaleLowerCase().split('t')[0];
//     this.user$.subscribe((user) => {
//       if (user) {
//         this.userId = user.uid;
//       }
//     })
//    }

//  async ngOnInit() {
//   this.rows = []; 
//   try {
//     this.expense_categories = await this.firestoreService.getCategories('Expense');
//     this.income_categories = await this.firestoreService.getCategories('Income');
//     console.log("Categories: ", this.expense_categories);
    
//   }
//   catch (error) {
//     console.log("Error getting categories: ", error);
//   }
// }

// formatTime() {
//   const date = new Date();
//   return String(date.getDay()).padStart(2, '0') + '/' + String(date.getMonth()).padStart(2, '0') + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
// }

// add(){
//   console.log("Selected category: ", this.categ);
//   let userId = this.userId ?? localStorage.getItem('userId');
//   if (this.selectedData === 'Expense') {
    
//   }

//   else if (this.selectedData === 'Income') {
   
//   }

//   else if(this.selectedData === 'Budget'){
   
//   }

//   else{ 
//     console.log("Adding payment");
    
//     console.log("Date: ", this.date);
//     console.log("Type of date:", typeof this.date);
    
//     if (isNaN(this.amount!) || this.amount! < 0 || !/^\d+$/.test(this.amount!.toString())) {
//       alert('Please enter a valid amount');
//       return;
//     }
//     const payment: Payment = {
//       amount: this.amount!,
//       dueDate: Timestamp.fromDate(new Date(this.paymentVar)),
//       description: this.description,
//       userId: userId

//     }
    
//     this.paymentService.addPayment(payment, userId);
//     this.router.navigate(['/tabs']);
//   }
// }


// validateAmount(event: any) {
//   let value = event.detail.value;
//   console.log("Value: ", value);
  
//   // Prevent adding '-' if there's already a digit
//   if (/^\d+/.test(value) && value.includes('-')) {
//     event.target.value = value.replace('-', '');  // Remove the minus
//     console.log("Event target value: ", event.target.value);
    
//   }

//   this.amount = event.target.value;  // Update the value in the model
//   console.log("Amount: ", this.amount);
  
// }

// typeMonth() {
//   console.log("Selected month:", this.selectedMonth);
  
// }

// }
