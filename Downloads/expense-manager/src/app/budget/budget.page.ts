import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { User } from 'firebase/auth'; // Import Firebase User type
import { map, Observable } from 'rxjs';
import { FirestoreService } from '../firestore.service';
import { Budget} from '../models';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../budget.service';
import { GeminiService } from '../gemini.service';


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

  generating = false;
  advisedBudget: Budget = {} as Budget;
  showCurrent = false;
  currentPair: {month: number, budget: Budget | null} = {} as {month: number, budget: Budget} ;
  user$: Observable<User | null> = this.firestoreService.user$;
  minDate = new Date();
  selectedDate: Date = new Date();
  budget$!: Observable<{month: number, budget: Budget} | null | undefined>;
  loading = true;
  response: string = ''; 
  setBudget: Budget = {} as Budget;
  currentBudget: Budget = {} as Budget;
  currentBudget$! : Observable<{month: number, budget: Budget | null}[] | null>;
  currentBudgetSingle$! : Observable<{month: number, budget: Budget | null} | null>;
  userId! :string;
  constructor( 
     private firestoreService: FirestoreService, 
    private router: Router, private budgetService : BudgetService,
    private geminiService: GeminiService
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

    async onMonthChange(selectedMonth: number) {
      console.log('Month changed to:', this.months[selectedMonth].display);
      // this.budgetService.currentBudgetSubject.next(null);
      await Promise.all([this.budgetService.getCurrentSpendings(selectedMonth + 1, this.userId ?? localStorage.getItem('userId')),
      this.budgetService.getUserBudgetByMonth( this.userId ?? localStorage.getItem('userId'), selectedMonth + 1 )]);
      
 
      // Fetch data based on the selected month
    }

  async bindData() {
    this.loading = true;
    console.log("Selected date:", this.selectedDate);
    this.currentBudget$ = this.budgetService.currentBudget$;
    this.currentBudgetSingle$ = this.budgetService.currentBudget$.pipe(
      map((budgets) => {
        const pair : {month: number, budget: Budget | null} =
            budgets?.find((budget) => budget.month === this.currentMonth.value + 1)!
            ;
            console.log("Pair: ", pair);
        this.currentPair = pair;
        return pair;
      }));


    this.budget$ = this.budgetService.cachedBudgetSubject.pipe(
      map((budgets) =>{
        console.log("Budgets: ", budgets);
        
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
      
      await this.budgetService.getUserBudgetByMonth(this.userId, this.selectedDate.getMonth() + 1);
      await this.budgetService.getCurrentSpendings(this.selectedDate.getMonth() + 1, this.userId ?? localStorage.getItem('userId'));
      this.loading = false;
  }
  getBudgetColor(): string {
    if (!this.currentPair.budget) {
      return '';
    }
    const percentage = (this.currentPair.budget.totalBudget / this.setBudget.totalBudget) * 100;
  
    if (percentage < 40) {
      return '#4CAF50'; // Safe Zone ✅ (Deeper Green for contrast)
    } else if (percentage < 60) {
      return '#FFC107'; // Warning ⚠️ (Vibrant Amber for better visibility)
    } else {
      return '#FF5252'; // Danger! ❌ (Stronger Red for emphasis)
    }
  }
  
  getFormattedPercentage(): string {
    if (!this.setBudget.totalBudget || !this.currentPair.budget?.totalBudget) {
      return '0';
    }
    const percentage = (this.currentPair.budget.totalBudget / this.setBudget.totalBudget) * 100;
    return percentage.toFixed(2); // Ensures exactly 2 decimal places
  }
  

  getSpendingColor(spendingCateg: string, spendingValue: number): string {
    if (!this.currentPair.budget || !this.setBudget.spendings) {
      return '';
    }
    const setSpendingValue = this.setBudget.spendings[spendingCateg];

    if (!setSpendingValue) {
      return '';
    }
    const percentage = (spendingValue / setSpendingValue) * 100;
    if (percentage < 40) {
      return 'green'; // Safe Zone ✅
    } else if (percentage < 60) {
      return 'yellow'; // Warning ⚠️
    } else {
      return 'red'; // Danger! ❌
    }
  }
  async generatePersonalizedBudget() {
    this.generating = true;
    const userId = localStorage.getItem('userId');
    console.log("User id: ", userId );
    
    const user = await this.firestoreService.getUserByuid(userId!);
    console.log("Gotten user: ", user);
    
    const {ageRange, country, debtAmount, fixedExpenses, variableExpenses, savingsGoal, savings, monthlyIncome, hasDebt} = user;
    const data = {ageRange, country, debtAmount, fixedExpenses, variableExpenses, savingsGoal, savings, monthlyIncome, hasDebt};
    this.geminiService.generateBudget(data).subscribe({
      next: (res: any) => {
        console.log("AI repsonse successful: ", res);
        this.generating = false;
        this.response = (res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
        console.log("Response: ", this.response);
        const parsedResponse = JSON.parse(this.response);
        this.advisedBudget.spendings = parsedResponse;
        this.advisedBudget.month = this.currentMonth.value + 1;
        this.advisedBudget.userId = userId!;

        let totalBudget = 0;
        Object.keys(parsedResponse).forEach((key) => {
          totalBudget += parsedResponse[key];
        });

        this.advisedBudget.totalBudget = totalBudget;

      },
      error: (err: any) => {
        console.error("AI text generation failed: ", err);
        
      }
    }
      
    )
  }

  closePopup() {
    this.response = '';
    this.advisedBudget = {} as Budget;
  }

  async saveAdvisedBudget() {
    const userId = localStorage.getItem('userId');
    this.budgetService.addBudget(userId!, this.advisedBudget);
    this.closePopup();
  }
  
  async getCurrentBudget() {
    const uid = localStorage.getItem('userId');
    console.log("User id: ", uid);
    
    const month = this.currentMonth.value + 1;
    console.log("Month:", month);

    await this.budgetService.getCurrentSpendings(month, uid!);
  }

  async addAdvisedBudget() {
    const userId = localStorage.getItem('userId');
    await this.budgetService.addBudget(userId!, this.advisedBudget);
  }

  formatDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}


 

}