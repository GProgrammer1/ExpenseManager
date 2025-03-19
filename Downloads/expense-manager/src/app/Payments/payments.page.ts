import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, map, merge, Observable, Subscription, switchMap, take } from 'rxjs';
import { Budget, Category, Expense, Income, Payment } from '../models';
import { Router, RouterLink } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { AlertController } from '@ionic/angular';
import { Subscription as AppSubscription } from '../models';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';
import { User as AppUser } from '../models';
import { Timestamp } from 'firebase/firestore';
import { time } from 'ionicons/icons';
import { tap } from 'rxjs';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class PaymentPage {
  compareDates(paymentDate: Date, payment: Payment) {
    const dueDate = new Timestamp(payment.dueDate.seconds, payment.dueDate.nanoseconds).toDate();
    return paymentDate.getDay() === dueDate.getDay();
  }

  user$: Observable<AppUser | null> = this.authService.user$;
  minDate = new Date();
  selectedDate: Date = new Date();
  dueDates$!: Observable<Date[]>;
  dropdownOpen = false;
  subscriptions$!: Observable<AppSubscription[]>;
  budget$!: Observable<Budget | null>;
  totalAmount$!: Observable<number>;
  loading = true;

  userEmail!: string;
  userId!: string;
  payments$!: Observable<Payment[]>;

  constructor(
    private paymentService: PaymentService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    private alertController: AlertController,
    private authService: AuthService
  ) {
    this.loading = true;
    this.bindData();
    this.user$.subscribe((user) => {
      if (user) {
        this.userId = user.id;
      } else {
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
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteSubscription(subscription);
          },
        },
      ],
    }).then((alert) => alert.present());
  }

  deleteSubscription(subscription: AppSubscription) {
    this.subscriptionService.deleteSubscription(subscription).subscribe({
      next: () => {
        this.subscriptionService.subscriptionSubject.next([
          ...this.subscriptionService.subscriptionSubject.getValue().filter((sub) => sub.id !== subscription.id),
        ]);
      },
      error: (err) => {
      },
    });
  }

  timeUntil(dueDate: Date) {
    const today = new Date();
    const diff = dueDate.getTime() - today.getTime();
    const diffDays = diff / (1000 * 3600 * 24);

    return Math.ceil(diffDays);
  }

  async presentAddSubscriptionDialog() {
    const alert = await this.alertController.create({
      header: 'Add Subscription',
      inputs: [
        {
          name: 'subscriptionName',
          type: 'text',
          placeholder: 'Subscription Name',
        },
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Amount',
          min: 0,
        },
        {
          name: 'dayOfTheMonth',
          type: 'number',
          placeholder: 'Day of the Month',
          min: 1,
          max: 31,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Add',
          handler: (data) => {
            if (data.subscriptionName && data.amount) {
              this.addSubscription(data.subscriptionName, data.amount, data.dayOfTheMonth);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async addSubscription(name: string, amount: number, dayOfTheMonth: number) {
    const userId = localStorage.getItem('userId')!;

    const subscription: AppSubscription = {
      id: '',
      userId,
      name,
      amount: Number(amount),
      dayOfTheMonth,
    };

    this.subscriptionService.addSubscription(subscription).subscribe({
      next: (response) => {
        this.subscriptionService.subscriptionSubject.next([
          ...this.subscriptionService.subscriptionSubject.getValue(),
          response.subscription,
        ]);
      },
      error: (err) => {
      },
    });
  }

  sortDates(dates: Date[]) {
    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  getCategoryName(category: string) {
    const categoryObj: Category = JSON.parse(category);
    return categoryObj.name;
  }

  deleteData(item: Payment) {
    this.paymentService.deletePayment(item as Payment).subscribe({
      next: () => {
        this.paymentService.paymentSubject.next([
          ...this.paymentService.paymentSubject.getValue().filter((payment) => payment.id !== item.id),
        ]);
      },
      error: (err) => {
      },
    });
  }

  async bindData() {
    this.payments$ = this.paymentService.payments$.pipe(tap(() => (this.loading = false)));
    this.dueDates$ = this.payments$.pipe(
      map((payments) => {
        const dueDates = payments.map((payment) => {
          const timestamp = new Timestamp(payment.dueDate.seconds, payment.dueDate.nanoseconds);
          return timestamp.toDate();
        });

        const uniqueDates = Array.from(
          new Set(
            dueDates.map((date) => {
              const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
              return date.toLocaleDateString('en-GB');
            })
          )
        );

        const uniqueDateObjects = uniqueDates.map((dateStr) => {
          const [day, month, year] = dateStr.split('/');
          return new Date(`${year}-${month}-${day}`);
        });

        this.loading = false;
        return uniqueDateObjects;
      })
    );
    this.subscriptions$ = this.subscriptionService.subscriptions$;

    this.paymentService.getPayments(this.userId ?? localStorage.getItem('userId')).subscribe({
      next: (payments) => {
        this.paymentService.paymentSubject.next(payments);
        this.loading = false;
      },
      error: (error) => {
      },
    });

    this.subscriptionService.getUserSubscriptions(this.userId ?? localStorage.getItem('userId')).subscribe({
      next: (subscriptions) => {
        this.subscriptionService.subscriptionSubject.next(subscriptions);
      },
      error: (error) => {
      },
    });
  }

  hasPaymentsForDate(dueDate: Date, payments: Payment[]): boolean {
    return payments.some((payment) => this.compareDates(dueDate, payment));
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

  async presentDeleteDialog(item: Payment) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteData(item);
          },
        },
      ],
    });

    await alert.present();
  }
}