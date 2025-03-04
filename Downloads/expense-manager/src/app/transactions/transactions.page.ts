import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, User, UserInfo } from 'firebase/auth'; // Import Firebase User type
import { BehaviorSubject, combineLatest, concat, debounceTime, from, map, merge, Observable, switchMap, take } from 'rxjs';
import { FirestoreService } from '../firestore.service';
import { Budget, Category, Expense, Income, Payment } from '../models';
import { Timestamp } from 'firebase/firestore';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Auth, user } from '@angular/fire/auth';
import { BudgetService } from '../budget.service';
import { PaymentService } from '../payment.service';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, card, cash, wallet } from 'ionicons/icons';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FcmService } from '../fcm.service';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
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
})
export class TransactionsPage{
totalExpenses$!: Observable<number>;
totalIncomes$!: Observable<number>;

compareDates(paymentDate: Date, dueDate: Date) {

  return paymentDate.getDay() === dueDate.getDay(); 
}

showPlaceholder = false;

  user$: Observable<User | null> = this.firestoreService.user$;
  minDate = new Date(new Date().getFullYear(), 0, 1);  maxDate = new Date();
  selectedDate: Date = new Date();

  expenses$! : Observable<Expense[]>;
  incomes$! : Observable<Income[]>;
  dueDates$! : Observable<Date[]>;
  selectedData : 'All' | 'Expenses' | 'Incomes'| 'Budgets' | 'Payments' = 'All';
  combinedData$!: Observable<Expense[] | Income[]>;
  response = '';
  budget$!: Observable<Budget | null>;
  totalAmount$!: Observable<number>;
  loading = true;
  selectedFilter = 'All';
  filterCriteria$ = new BehaviorSubject<string>('All'); // Default: show all

filteredData$!: Observable<(Expense | Income)[]>;
  private auth: Auth;
  userEmail! :string;
  userId!: string;
  payments$!: Observable<Payment[]>;
  selectedDate$ = new BehaviorSubject<string>(this.formatDate(this.selectedDate));
  constructor(
     private firestoreService: FirestoreService, private authService: AuthService,
    private router: Router, private budgetService : BudgetService, private alertController : AlertController,
    ) {
      addIcons({ add, wallet });
      console.log("Selected date:", this.selectedDate);
      console.log("SELECETDE DATE SUBJECT VALUE:", this.selectedDate$.value);
      
      this.auth = getAuth();
      this.expenses$ = firestoreService.expenses$;
      this.incomes$ = firestoreService.incomes$;
      this.combinedData$ = combineLatest([this.incomes$,this.expenses$]).pipe(
        map(([incomes, expenses]) => {
          console.log("Incomes:", incomes);
          console.log("Expenses:", expenses);
          
          
          const allData = [
            ...incomes.map((income: Income) => ({ ...income, type: 'income' })),
            ...expenses.map((expense: Expense) => ({ ...expense, type: 'expense' }))
          ];
          return allData;
        }
      ));
  
      

      this.filteredData$ = combineLatest([
        this.combinedData$,
        this.filterCriteria$,
        this.selectedDate$
      ]).pipe(
        map(([data, criteria, selectedDate]) => {
          if (criteria === 'All') {
            console.log("Selected date:", selectedDate);
            
            console.log("Data:", data.filter(item => {
              const date = item.Date.toDate();
              console.log("Item date:", date.toISOString().split('T')[0], "selected date:", selectedDate);
              
              return date.toISOString().split('T')[0] === selectedDate;
            }
            ));
            
            return data.filter(item => {
              const date = item.Date.toDate();
              return date.toISOString().split('T')[0] === selectedDate;
            }
            );
          } else {
            return data.filter(item => item.type === criteria.toLowerCase() && item.Date.toDate().toISOString().split('T')[0] === selectedDate);
          }
        })
      );

      this.totalAmount$ = this.filteredData$.pipe(
        map((data) => {
          return data.reduce((total, item) => {
            return total + (item.type === 'income' ? item.Amount : -item.Amount);
          }, 0);
        })
      );
      console.log("Selected data:", this.selectedData);
      this.user$.pipe(
        take(1), // Only take the first emitted value (the user object)
        debounceTime(1000), // Wait for 1 second before proceeding
        switchMap(user => {
          if (user) {
            this.userEmail = user.email!;
            this.userId = user.uid;
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
            } else {
              this.router.navigate(['/login']);
              return new BehaviorSubject(null);
            }
          }
        })
      ).subscribe();
      
    }

    formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit format
      const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit format
      return `${year}-${month}-${day}`;
    }
    

    onDateChange() {
      this.selectedDate$.next(this.formatDate(this.selectedDate));
    }

    setFilter(criteria: string) {
      console.log("Filter criteria:", criteria);
      
      this.filterCriteria$.next(criteria);
    }
    
    isDatePickerVisible: boolean = false;

    toggleDatePicker() {
      this.isDatePickerVisible = !this.isDatePickerVisible;
    }

    getCategoryName(category: string) {

      const categoryObj : Category = JSON.parse(category);
      return categoryObj.Name;
    }
  
    deleteData(item: Expense | Income) {
      if (item.type === 'expense') {
      
          this.firestoreService.deleteExpense(this.userId, item as Expense);
          this.budgetService.signalChange('Expense');
        
      } else if (item.type === 'income') {
        this.firestoreService.deleteIncome(this.userId, item as Income);
        this.budgetService.signalChange('Income');
      }

    }

    async bindData() {
      this.loading = true;
      console.log("Selected date:", this.selectedDate);
    
      console.log("User id: ", this.userId);
      
      const timestamp = Timestamp.fromDate(new Date(this.selectedDate));
      console.log("Timestamp: ", timestamp.toDate());
        await this.firestoreService.getAllTransactions(this.userId);
        this.loading = false;
    
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



  async signout() {

    localStorage.removeItem('userId');
   await  this.authService.signout();
    
    this.router.navigate(['/login'], { replaceUrl: true });
  }


  formatLocaleDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
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