import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { User } from 'firebase/auth'; // Import Firebase User type
import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { FirestoreService } from '../firestore.service';
import { Budget} from '../models';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../budget.service';
import { PaymentService } from '../payment.service';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: './budget.page.html',
  styleUrls: ['./budget.page.scss'],
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
    RouterLink
  ],
})
export class BudgetPage {

compareDates(paymentDate: Date, dueDate: Date) {

  return paymentDate.getDay() === dueDate.getDay(); 
}

  showCurrent = false;
  user$: Observable<User | null> = this.firestoreService.user$;
  minDate = new Date();
  selectedDate: Date = new Date();
  budget$!: Observable<{month: number, budget: Budget} | null | undefined>;
  loading = true;

  setBudget!: Budget;
  currentBudget$! : Observable<Budget | null>;

  userId! :string;
  constructor( 
     private firestoreService: FirestoreService, 
    private router: Router, private budgetService : BudgetService
    ) {

      this.bindData();
      
      this.user$.subscribe((user) => {
        console.log("User in constructor:", user);
        
        if (user) {
          this.userId = user.uid;
          
        }
      });     
    }

    months = [
      { value: 0, display: 'January' },
      { value: 1, display: 'February' },
      { value: 2, display: 'March' },
      { value: 3, display: 'April' },
      { value: 4, display: 'May' },
      { value: 5, display: 'June' },
      { value: 6, display: 'July' },
      { value: 7, display: 'August' },
      { value: 8, display: 'September' },
      { value: 9, display: 'October' },
      { value: 10, display: 'November' },
      { value: 11, display: 'December' },
    ];
  
    currentMonth = this.months[new Date().getMonth()]; // Default to the current month
  
    toggleMonth(direction: 'back' | 'forward'): void {
      const currentIndex = this.months.findIndex((m) => m.value === this.currentMonth.value);
  
      if (direction === 'back') {
        this.currentMonth =
          currentIndex > 0 ? this.months[currentIndex - 1] : this.months[this.months.length - 1];
          console.log("Current month:" , this.currentMonth);
          
      } else if (direction === 'forward') {
        this.currentMonth =
          currentIndex < this.months.length - 1 ? this.months[currentIndex + 1] : this.months[0];
          console.log("Current month: ", this.currentMonth);
          
      }
      this.showCurrent = false;
      this.onMonthChange(this.currentMonth.value);
    }
  
    toggleAction() {
      // this.showCurrent = !this.showCurrent;
      // console.log("Show current:", this.showCurrent);
      if (this.showCurrent) {
        this.getCurrentBudget();
      }
      if (!this.showCurrent) {
        this.budgetService.currentBudgetSubject.next(null);
      }
    }
    async onMonthChange(selectedMonth: number) {
      console.log('Month changed to:', this.months[selectedMonth].display);
      this.budgetService.currentBudgetSubject.next(null);
      const budget = await this.budgetService.getUserBudgetByMonth(this.userId ?? localStorage.getItem('userId') ,  selectedMonth + 1);
      
      // Fetch data based on the selected month
    }

  async bindData() {
    this.loading = true;
    console.log("Selected date:", this.selectedDate);
    this.currentBudget$ = this.budgetService.currentBudget$;
    this.budget$ = this.budgetService.cachedBudgetSubject.pipe(
      map((budgets) =>{
        const bool =  budgets.find((b) => b.month === this.currentMonth.value + 1) ;
        console.log("Exists month:", bool);
        if (!bool) {
          return null;
        }
        this.setBudget = bool.budget;
        return bool;
      }
    ) 
    );
    


    console.log("Selected month:", this.selectedDate.getMonth() + 1);
    
      if (!this.userId) {
        this.userId = localStorage.getItem('userId')!;
      }

      
      console.log("User id: ", this.userId);
      
      await this.budgetService.getUserBudgetByMonth(this.userId ?? localStorage.getItem('userId') ,  this.selectedDate.getMonth()+ 1);
      this.loading = false;
  }

  
  async getCurrentBudget() {
    const uid = localStorage.getItem('userId');
    console.log("User id: ", uid);
    
    const month = this.currentMonth.value + 1;
    console.log("Month:", month);

    await this.budgetService.getCurrentSpendings(month, uid!);
  }

  formatDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}


 

}