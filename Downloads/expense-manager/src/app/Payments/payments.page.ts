import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, User, UserInfo } from 'firebase/auth'; // Import Firebase User type
import { BehaviorSubject, combineLatest, concat, from, map, merge, Observable, Subscription, switchMap, take } from 'rxjs';
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
import { Subscription as AppSubscription } from '../models';

@Component({
  selector: 'app-home',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
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
    RouterLink,
    MatIconModule,
  ],
})
export class PaymentPage{
compareDates(paymentDate: Date, dueDate: Date) {

  return paymentDate.getDay() === dueDate.getDay(); 
}


  user$: Observable<User | null> = this.firestoreService.user$;
  minDate = new Date();
  selectedDate: Date = new Date();
  dueDates$! : Observable<Date[]>;
 dropdownOpen = false;
  subscriptions$!: Observable<AppSubscription[]>;
  budget$!: Observable<Budget | null>;
  totalAmount$!: Observable<number>;
  loading = true;

  private auth: Auth;
  userEmail! :string;
  userId!: string;
payments$!: Observable<Payment[]>;

  constructor(private afAuth: AngularFireAuth, private paymentService: PaymentService,
     private firestoreService: FirestoreService, private authService: AuthService,
    private router: Router, private budgetService : BudgetService, private alertController : AlertController
    ) {

      this.auth = getAuth();
      this.bindData();
      this.user$.subscribe((user) => {
        console.log("User in constructor:", user);
        
        if (user) {
          this.userId = user.uid;
        }
        else {
          this.userId = localStorage.getItem('userId')!;
        }
      });
     
      
    }

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    }

    isNearPayment(dueDate: Date) {
      const today = new Date();
      const diff = dueDate.getTime() - today.getTime();
      const diffDays = diff / (1000 * 3600 * 24);
      return diffDays < 3;
    }
    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
      const targetElement = event.target as HTMLElement;
      if (!targetElement.closest('#view-subscriptions')) {
        this.dropdownOpen = false;
      }
    }

    presentDeleteSubscriptionDialog(subscription: AppSubscription) {
      this.alertController.create({
        header: 'Confirm Delete',
        message: `Are you sure you want to delete the subscription "${subscription.name}"?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: () => {
              this.deleteSubscription(subscription);
            }
          }
        ]
      }).then(alert => alert.present());
    }


    async deleteSubscription(subscription: AppSubscription) { 
      console.log(`Deleted subscription: ${subscription.name}`);
     await this.firestoreService.deleteSubscription(subscription);
    }
    

    timeUntil(dueDate: Date) {
      const today = new Date();
      const diff = dueDate.getTime() - today.getTime();
      const diffDays = diff / (1000 * 3600 * 24);
      const diffHours = diff / (1000 * 3600);
      const diffMinutes = diff / (1000 * 60);

      return `${Math.ceil(diffDays)} days`;
    }

    async presentAddSubscriptionDialog() {
      const alert = await this.alertController.create({
        header: 'Add Subscription',
        inputs: [
          {
            name: 'subscriptionName',
            type: 'text',
            placeholder: 'Subscription Name'
          },
          {
            name: 'amount',
            type: 'number',
            placeholder: 'Amount',
            min: 0
          },
          {
            name: 'dayOfTheMonth',
            type: 'number',
            placeholder: 'Day of the Month',
            min: 1,
            max: 31
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Add',
            handler: (data) => {
              if (data.subscriptionName && data.amount) {
                this.addSubscription(data.subscriptionName, data.amount, data.dayOfTheMonth);
              } else {
                // Handle invalid input (optional)
                console.log('Invalid input');
              }
            }
          }
        ]
      });
  
      await alert.present();
    }
  
    async addSubscription(name: string, amount: number, dayOfTheMonth: number) {
      console.log(`Added Subscription: ${name}, Amount: ${amount}`);
      const userId = localStorage.getItem('userId')!;

      const subscription: AppSubscription = {
        userId,
        name,
        amount: Number(amount),
        dayOfTheMonth
      };

      await this.firestoreService.addSubscription(subscription);
      // Logic to save subscription (e.g., update state or send to backend)
    }



    sortDates(dates: Date[]) {
      return dates.sort((a, b) => a.getTime() - b.getTime());
    }
getCategoryName(category: string) {

  const categoryObj : Category = JSON.parse(category);
  return categoryObj.name;
}
  
deleteData(item: Payment) {

    this.paymentService.deletePayment(item as Payment,this.userId ??localStorage.getItem('userId'));

  }

  async bindData() {
    this.loading = true;
    console.log("Selected date:", this.selectedDate);
  
    this.payments$ = this.paymentService.payments$ ;
    this.dueDates$ = this.payments$.pipe(
     
      map((payments) => {
        console.log("Payments: ", payments);
    
        const dueDates = payments.map((payment) => payment.dueDate.toDate());
    
        // Extract parts in local time using options and ensure unique days
        const uniqueDates = Array.from(
          new Set(
            dueDates.map((date) => {
              const options = { 
                year: "numeric", 
                month: "2-digit", 
                day: "2-digit" 
              };
              return date.toLocaleDateString("en-GB"); // Format to local date
            })
          )
        );
    
        // Convert unique string dates back to Date objects if needed
        const uniqueDateObjects = uniqueDates.map((dateStr) => {
          const [day, month, year] = dateStr.split("/");
          return new Date(`${year}-${month}-${day}`); // Convert back to Date object
        });
    
        console.log("Unique Dates: ", uniqueDateObjects);
        return uniqueDateObjects;
      })
    );
    this.subscriptions$ = this.firestoreService.subscriptions$;
    console.log("Selected month:", this.selectedDate.getMonth() + 1);
    console.log("User id: ", this.userId);
    
      await this.paymentService.getPaymentsByMonth(this.userId ?? localStorage.getItem('userId'), Timestamp.fromDate(this.selectedDate)); //expenses emitted a value
      await this.firestoreService.getUserSubscriptions(this.userId ?? localStorage.getItem('userId')); //inomes emitted  a value
      this.loading = false;
    //expenses emitted a value
    // }, 500);
  }

  hasPaymentsForDate(dueDate: Date, payments: Payment[]): boolean {
    return payments.some(payment => this.compareDates(dueDate, payment.dueDate.toDate()));
  }
  formatDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}

  addData() {
    this.router.navigate(['add']);
  }

  async presentDeleteDialog( item: Payment) {
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
}