import {  Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, ViewChild} from '@angular/core';
import { IonModal } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, combineLatest, debounceTime, from, map, merge, Observable, switchMap, take } from 'rxjs';
import { FirestoreService } from '../services/firestore.service';
import { Budget, Category, Expense, Income, Payment } from '../models';
import { Timestamp } from 'firebase/firestore';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {  MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../services/budget.service';
import { AlertController, PopoverController } from '@ionic/angular';

import { MatFormFieldModule } from '@angular/material/form-field';
import { ExpenseService } from '../services/expense.service';
import { IncomeService } from '../services/income.service';
import {User as AppUser} from '../models'
import firebase from 'firebase/compat';
import { animate, style, transition, trigger } from '@angular/animations';
import { set } from 'lodash';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    RouterLink
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [ // When element appears
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [ // When element disappears
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class TransactionsPage{
totalExpenses$!: Observable<number>;
totalIncomes$!: Observable<number>;

compareDates(paymentDate: Date, dueDate: Date) {

  return paymentDate.getDay() === dueDate.getDay(); 
}

showPlaceholder = false;

  user$: Observable<AppUser | null> = this.firestoreService.user$;
  minDate = new Date(new Date().getFullYear(), 0, 1);  maxDate = new Date();
  selectedDate: string = new Date().toISOString();
  @ViewChild('dropDown') dropdown!: ElementRef
  expenses$! : Observable<Expense[]>;
  incomes$! : Observable<Income[]>;
  dueDates$! : Observable<Date[]>;
  selectedData : 'All' | 'Expense' | 'Income' = 'All';
  combinedData$!: Observable<Expense[] | Income[]>;
  response = '';
  popoverEvent: any;

  budget$!: Observable<Budget | null>;
  totalAmount$!: Observable<number>;
  loading = true;
  selectedFilter = 'All';
  filterCriteria$ = new BehaviorSubject<string>('All'); // Default: show all
  showDatePicker = false;

filteredData$!: Observable<(Expense | Income)[]>;
  userEmail! :string;
  userId!: string;
  popoverOpen = false;
totalIncome$!: Observable<number>;
totalExpense$!: Observable<number>;
  payments$!: Observable<Payment[]>;
  selectedDate$ = new BehaviorSubject<string>(this.formatDate(new Date(this.selectedDate)));


  @HostListener('document:click', ['$event']) 
  onClickOutside(event: Event) {
    if (this.dropdownOpen && this.dropdown && !this.dropdown.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  onFilterChange(event: any) {
    this.filterCriteria$.next(event.target.value);
  }
  
  constructor(
     private firestoreService: FirestoreService, private authService: AuthService, private expenseService: ExpenseService,
     private incomeService: IncomeService,
    private router: Router, private budgetService : BudgetService, private alertController : AlertController,
    ) {
     
      this.expenses$ = this.expenseService.expenses$;
      this.incomes$ = this.incomeService.incomes$;
      this.combinedData$ = combineLatest([this.incomes$,this.expenses$]).pipe(
        map(([incomes, expenses]) => {
          const allData = [
            ...incomes.map((income: Income) => ({ ...income, type: 'income' })),
            ...expenses.map((expense: Expense) => ({ ...expense, type: 'expense' }))
          ];
          return allData;
        }
      ));
  
      this.filterCriteria$.subscribe(criteria => {
        this.selectedData = criteria as 'All' | 'Expense' | 'Income' ;
      }
      );
      this.totalIncome$ = this.incomes$.pipe(
        map(incomes => incomes.reduce((total, income) => total + income.amount, 0))
      );

      this.totalExpense$ = this.expenses$.pipe(
        map(expenses => expenses.reduce((total, expense) => total + expense.amount, 0))
      );

      this.filteredData$ = combineLatest([
        this.combinedData$,
        this.selectedDate$,
        this.filterCriteria$
      ]).pipe(
        map(([data,  selectedDate, filterCriteria]) => {
          
        
            
            console.log("Selected date:", selectedDate);
            
            
            this.loading = false;
            return data.filter(item => {
            
              const timestamp = new Timestamp(item.date.seconds, item.date.nanoseconds);
              const date = timestamp.toDate();
              if (filterCriteria === 'All') {
              return date.toISOString().split('T')[0] === selectedDate;
              } else {
                console.log("Item type:", item.type);
                console.log("Filter criteria:", filterCriteria);
                
                return date.toISOString().split('T')[0] === selectedDate && item.type === filterCriteria.toLowerCase();
              }
            }
            );
         
        })
      );

      this.totalAmount$ = this.combinedData$.pipe(
        map((data) => {
          return data.reduce((total, item) => {
            return total + (item.type === 'income' ? item.amount : -item.amount);
          }, 0);
        })
      );

      this.user$.pipe(
        take(1), // Only take the first emitted value (the user object)
        debounceTime(1000), // Wait for 1 second before proceeding
        switchMap(user => {
          if (user) {
            this.userEmail = user.email!;
            this.userId = user.id;
            console.log('User id in constructor:', this.userId);
            localStorage.setItem('email', this.userEmail!);
  
            // Now that the userId is set, we can proceed with fetching data
            return this.bindData(); // Return the function that fetches expenses/incomes
          } else {
            const userId = localStorage.getItem('userId');
            console.log('User id in constructor:', userId);
            if (userId) {
              this.userId = userId;
              return this.bindData();
            }
            else {
              this.router.navigate(['/login']);
              return new BehaviorSubject(null);
            }
          }
        })
      ).subscribe();
      
    }
    dropdownOpen = false;
    isDatePickerOpen: boolean = false;

    toggleDropdown(event: any) {
      event.stopPropagation();
      this.dropdownOpen = !this.dropdownOpen;
    }

   

    formatNumber(value: number): string {
      const absValue = Math.abs(value);
    
      const format = (num: number, suffix: string) =>
        (Math.floor(num * 100) / 100).toFixed(2) + suffix;
    
      if (absValue >= 1_000_000_000) {
        return format(absValue / 1_000_000_000, 'B');
      } else if (absValue >= 1_000_000) {
        return format(absValue / 1_000_000, 'M');
      } else if (absValue >= 1_000) {
        return format(absValue / 1_000, 'K');
      }
    
      return value.toFixed(2); // Ensures small numbers have 2 decimals
    }
    
    goToProfile() {
      console.log('Navigating to Profile');
      // Navigate to the profile page here
    }

    toScientificNotation(value: number): string {
      if (Math.abs(value) < 1_000_000) {
        return new Intl.NumberFormat().format(value); // Add commas to regular numbers
      }
    
      const exponent = Math.floor(Math.log10(Math.abs(value)));
      const coefficient = (value / Math.pow(10, exponent)).toFixed(2);
    
      return `${new Intl.NumberFormat().format(parseFloat(coefficient))}E+${exponent}`;
    }

    formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit format
      const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit format
      return `${year}-${month}-${day}`;
    }
    

    onDateChange() {
      console.log("Selected date:", this.selectedDate);
      
      this.selectedDate$.next(this.formatDate(new Date(this.selectedDate)));
      this.closeDatePicker();
    }

    closeDatePicker() {
      this.isDatePickerOpen = false;
    }

    setFilter(criteria: string) {
      console.log("Filter criteria:", criteria);
      
      this.filterCriteria$.next(criteria);
    }
    
    isDatePickerVisible: boolean = false;

    toggleDatePicker() {
      this.isDatePickerOpen = !this.isDatePickerOpen;
    }

    getCategoryName(category: string) {

      const categoryObj : Category = JSON.parse(category);
      return categoryObj.name;
    }
    openCalendar() {
      this.isDatePickerOpen = !this.isDatePickerOpen; // Toggle the calendar visibility
    }
  
 
  
   
  
    confirmDate() {
      console.log("Confirmed Date:", this.selectedDate);
      this.isDatePickerOpen = false; // Close the date picker when Done is clicked
    }
  
    deleteData(item: Expense | Income) {
      if (item.type === 'expense') {
      
          this.expenseService.deleteExpense(this.userId, item as Expense).subscribe({
            next: (res: any) => {
              console.log("Expense deleted: ", res);
              this.expenseService.expenseSubject.next(this.expenseService.expenseSubject.value.filter(expense => expense.id !== item.id));
              this.budgetService.signalChange('Expense', {category: item.category, amount: -item.amount}, new Date(item.date.seconds * 1000).getMonth() + 1);
            },
            error: (err: any) => {
              console.error("Error deleting expense: ", err);
              
            }
          });
        
      } else {
        this.incomeService.deleteIncome(this.userId, item as Income).subscribe({
          next: (res: any) => {
            console.log("Income deleted: ", res);
            this.incomeService.incomeSubject.next(this.incomeService.incomeSubject.value.filter(income => income.id !== item.id));
            this.budgetService.signalChange('Income');
          },
          error: (err: any) => {
            console.error("Error deleting income: ", err);
          }
        });
      }

    }

    async bindData() {
      this.loading = true;
      console.log("Selected date:", this.selectedDate);
    
      console.log("User id: ", this.userId);
      
      const timestamp = Timestamp.fromDate(new Date(this.selectedDate));
      console.log("Timestamp: ", timestamp.toDate());
        
      this.expenseService.getExpenses(this.userId).subscribe({
      next: (expenses: Expense[]) => {
        console.log("Expenses:", expenses);
        this.loading = false;
        this.expenseService.expenseSubject.next(expenses);
      },
      error: (err: any) => {
        console.error("Error fetching expenses: ", err);
      }
    });
      this.incomeService.getIncomes(this.userId).subscribe({
        next: (incomes: Income[]) => {
          console.log("Incomes IN GETINCOMES:", incomes);
          this.loading = false;
          this.incomeService.incomeSubject.next(incomes);
        },
        error: (err: any) => {
          console.error("Error fetching incomes: ", err);
        }
    });
    

    
  }

    formatTimestamp(timestamp: Timestamp): string {
      const date = timestamp.toDate();  // Convert Firestore Timestamp to JS Date
    
      // Get the time zone offset in minutes (UTC+2 is 120 minutes ahead of UTC)
      const timezoneOffset = -date.getTimezoneOffset() / 60;  // in hours
    
      // Format the date to your desired format
      const formattedDate = date.toLocaleString('en-US', {
        weekday: 'long',   // e.g. "Monday"
        year: 'numeric',   // e.g. "2025"
        month: 'long',     // e.g. "January"
        hour: '2-digit',   // e.g. "02"
        minute: '2-digit', // e.g. "00"
        second: '2-digit', // e.g. "00"
        hour12: true,      // Use 12-hour format with AM/PM
        timeZone: 'UTC'    // Set the time zone to UTC to calculate from UTC time
      });
    
      // Construct the final string with the timezone info
      const timezoneString = `UTC${timezoneOffset >= 0 ? '+' : '-'}${Math.abs(timezoneOffset)}`;
    
      return `${formattedDate} ${timezoneString}`;
    }


  formatLocaleDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}


  async presentDeleteDialog( item: Expense | Income) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Delete canceled');
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            console.log('Item deleted');
            this.deleteData(item);
          }
        }
      ]
    });
  
    await alert.present();
  }

 
  // async presentSignoutDialog() {

  //   const alert = await this.alertController.create({
  //     header: 'Sign out',
  //     message: 'Are you sure you want to sign out?',
  //     buttons: [
  //       {
  //         text: 'Cancel',
  //         role: 'cancel',
  //         handler: () => {
  //           console.log('Sign out canceled');
  //         }
  //       },
  //       {
  //         text: 'Sign out',
  //         role: 'destructive',
  //         handler: () => {
  //           console.log('User signed out');
  //           this.signout();
  //         }
  //       }
  //     ]
  //   });
  
  //   await alert.present();
  // }
}