import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AsyncPipe, CommonModule, CurrencyPipe, KeyValuePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AnimationController } from '@ionic/angular';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { Budget, Expense} from '../models';
import { Router, RouterLink } from '@angular/router';
import { BudgetService } from '../services/budget.service';
import { GeminiService } from '../services/gemini.service';
import { AuthService } from '../services/auth.service';
import {User as AppUser} from '../models';
import { ExpenseService } from '../services/expense.service';
import { Timestamp } from 'firebase/firestore';
import _ from 'lodash';
@Component({
  selector: 'app-budget',
  templateUrl: './budget.page.html',
  styleUrls: ['./budget.page.scss'],
  standalone: true,
  imports: [IonicModule, KeyValuePipe, CurrencyPipe, AsyncPipe, CommonModule, RouterLink]
 
})
export class BudgetPage implements AfterViewInit, OnInit {

compareDates(paymentDate: Date, dueDate: Date) {

  return paymentDate.getDay() === dueDate.getDay(); 
}

  @ViewChild('budgetTable', { static: false }) budgetTable!: any;

  generating = false;
  advisedBudget: Budget = {} as Budget;
  showCurrent = false;
  user$!: Observable<AppUser| null>;
  minDate = new Date();
  selectedDate: Date = new Date();
  loading = true;
  user!: AppUser;
  previousBudget: any;
  budgets$ : Observable<Budget[]> | null = null;
  selectedMonthSubject = new BehaviorSubject<number>(new Date().getMonth() + 1);
  selectedMonth$ = this.selectedMonthSubject.asObservable();
  filteredBudgets$!: Observable<Budget|null>;
  currentBudgets$!: Observable<Budget[]>;
  filteredCurrentBudget$!: Observable<Budget | null>;
  response: string = ''; 
  setBudget: Budget = {} as Budget;
  userId! :string;
  shouldGlow = false;

  constructor( 
    private budgetService : BudgetService,
    private geminiService: GeminiService,
    private authService: AuthService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
    private animationCtrl: AnimationController,
    ) {
      this.loading = true;
      this.user$ = this.authService.user$;
      
      this.user$.subscribe((user) => {
        if (user) {
        this.user = user;
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
          
      } else if (direction === 'forward') {
        this.currentMonth =
          currentIndex < this.months.length - 1 ? this.months[currentIndex + 1] : this.months[0];
          
      }
      this.showCurrent = false;
      this.onMonthChange(this.currentMonth.value+ 1);
    }

    async onMonthChange(selectedMonth: number) {
      this.selectedMonthSubject.next(selectedMonth);
    
    }

    ngAfterViewInit(): void {
      this.filteredBudgets$.subscribe((newBudget) => {
        if (this.previousBudget && JSON.stringify(newBudget) !== JSON.stringify(this.previousBudget)) {
          this.triggerTableAnimation();
        }
        this.previousBudget = newBudget;
        this.cdr.detectChanges(); 
      });    }

    ngOnInit(): void {
        this.bindData();
    }

    triggerTableAnimation() {
      const animation = this.animationCtrl.create()
        .addElement(this.budgetTable.el)
        .duration(500)
        .fromTo('opacity', '0', '1')
        .fromTo('transform', 'translateY(-10px)', 'translateY(0)');
        
      animation.play();
      
    }

  async bindData() {

      this.budgets$= this.budgetService.budgets$;
      this.currentBudgets$ = this.budgetService.currentBudgets$;


    this.filteredBudgets$ = combineLatest([this.budgets$ ?? of([]), this.selectedMonth$]).pipe(
      map(([budgets, selectedMonth]) => {
        
        if (!budgets) {
          return {} as Budget;
        }
        const budget = budgets.find((b) => b.month === selectedMonth) ?? null;

        if (!budget) {
          this.setBudget = {month: selectedMonth, spendings: {}, totalBudget: 0, userId: this.userId, id: ''};
        } else {      
          this.setBudget = JSON.parse(JSON.stringify(budget));
        }
       
        return budget;
      })
    );

    this.filteredCurrentBudget$ = combineLatest([this.currentBudgets$ ?? of([]), this.selectedMonth$]).pipe(
      map(([budgets, selectedMonth]) => {      
        
        if (!budgets) {
          return {} as Budget;
        }
        return budgets.find((b) => b.month === selectedMonth) ?? null;
      })
    );
    
      if (!this.userId) {
        this.userId = localStorage.getItem('userId')!;
      }
      this.authService.getUserByuid(this.userId).subscribe({
        next: (user) => {
          this.user = user;
        }
      });
       this.budgetService.getAllBudgets(this.userId).subscribe({
        next: (budgets) => {
        this.budgetService.budgetSubject.next(budgets);
      },
    error: (err) => {
      console.error("Error fetching budgets: ", err);
      
    }
    });
      this.expenseService.getExpenses(this.userId).subscribe({
        next: (expenses: Expense[]) => {          
          
          let budgets: Budget[] = [];
          
          for (let i = 1; i <= 12; i++) {
            let spendings: {[key: string]: number} = {};
            let totalExpenses = 0;
            let totalBudget = 0;
            const monthExpenses = expenses.filter((expense) => new Timestamp(expense.date.seconds, expense.date.nanoseconds).toDate().getMonth() + 1 === i);
            monthExpenses.forEach((expense) => {
              totalExpenses += expense.amount;
              if (spendings[expense.category]) {
                spendings[expense.category] += expense.amount;
              } else {
                spendings[expense.category] = expense.amount;
              }
            });
            totalBudget += totalExpenses;
            budgets.push({month: i , spendings, totalBudget, userId: this.userId, id: ''});
          }          
          this.budgetService.currentBudgetsSubject.next(budgets);

        }
      });
      setTimeout(() => {
      this.loading = false;
      }, 2000);
    }


    getBudgetColor(currentBudget: Budget): string {
      if (!currentBudget.totalBudget || !this.setBudget.totalBudget) {
        return '#4CAF50';
      }
      const percentage = (currentBudget.totalBudget / this.setBudget.totalBudget) * 100;
    
      if (percentage < 40) {
        return '#4CAF50';
      } else if (percentage < 60) {
        return '#FFC107';
      } else {
        return '#FF5252';
      }
    }
  
    getFormattedPercentage(currentBudget: Budget): number {
       
      if (!this.setBudget?.totalBudget || !currentBudget.totalBudget) {
        const zero = 0;
        return Number(zero.toFixed(2));
      }

      
      const percentage = (currentBudget.totalBudget / this.setBudget.totalBudget) * 100;
      return Number(percentage.toFixed(2)); 
    }
  

  getSpendingColor(spendingCateg: string, spendingValue: number, currentBudget: Budget): string {
    if (!currentBudget || Object.keys(currentBudget.spendings).length === 0) {
      return '';
    }
    const setSpendingValue = this.setBudget.spendings[spendingCateg];

    if (!setSpendingValue) {
      return '';
    }
    const percentage = (spendingValue / setSpendingValue) * 100;
    if (percentage < 40) {
      return 'green'; 
    } else if (percentage < 60) {
      return '#FFC107'; 
    } else {
      return 'red'; 
    }
  }

  toScientificNotation(value: number): string {
    if (Math.abs(value) < 1_000_000) {
      return new Intl.NumberFormat().format(value); 
    }
  
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const coefficient = (value / Math.pow(10, exponent)).toFixed(2);
  
    return (`${(new Intl.NumberFormat().format(parseFloat(coefficient)))}E+${exponent}`);
  }
  
getTypeOf(value: any): string {
  return typeof value;
}
  
  async generatePersonalizedBudget() {
    this.generating = true;
    const userId = localStorage.getItem('userId');
    
    const {ageRange, country, debtAmount, fixedExpenses, variableExpenses, savingsGoal, savings, monthlyIncome, hasDebt,
      occupation, city
    } = this.user;
    const data = {ageRange, country, debtAmount, fixedExpenses, variableExpenses, savingsGoal, savings, monthlyIncome, hasDebt, occupation, city};
    this.geminiService.generateBudget(data).subscribe({
      next: (res: any) => {
        this.generating = false;
        this.response = (res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
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
    this.budgetService.addBudget(userId!, this.advisedBudget).subscribe({
      next: (res: any) => {
        let budget = res.budget;
        if (this.budgetService.budgetSubject.value.some(b => b.month === budget.month)) {
        
          this.budgetService.budgetSubject.next(this.budgetService.budgetSubject.value.map(b => b.month === budget.month ? {...budget, shouldGlow: true} : {...b, shouldGlow: false}));
        } else {
          this.budgetService.budgetSubject.next([...this.budgetService.budgetSubject.value!, {...budget, shouldGlow: true}]);
        }
        

      }
    });
    this.closePopup();
  }
  


  formatDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
  }


 

}