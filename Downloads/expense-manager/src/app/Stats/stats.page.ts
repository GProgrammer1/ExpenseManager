import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArcElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, PieController, Title, Tooltip } from 'chart.js';
import { FirestoreService } from '../services/firestore.service';
import { AuthService } from '../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
Chart.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, DoughnutController, PieController);

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,
   RouterLink
  ]
})
export class StatsPage implements OnInit {

  selectedDate: string = new Date().toISOString().split('T')[0];
  loading = true;
  minDate = new Date(2021, 0, 1);
  maxDate = new Date();
  noData = false;
  user$ = this.firestoreService.user$;
  userId! : string;
  selectedData: 'Expenses' | 'Incomes' = 'Expenses';
  cachedIncomes: any;
  cachedExpenses: any;
  labels: any;
  expensePercentages: any;
  incomePercentages: any;
  chartType: 'pie' | 'bar' = 'pie';

  ngOnInit() {
   
    this.router.navigate([`/tabs/stats/expenses/${this.currentMonth.value + 1}`]);
  }

  chartType$ : Observable<string> = this.firestoreService.chartType$;

  constructor(private firestoreService: FirestoreService, private authService : AuthService,
    private router: Router
  ) {
    
  }

  currentDate: Date = new Date();

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

    this.onMonthChange(this.currentMonth.value);
  }

  changeChartType(chartType: string): void {
    this.firestoreService.changeChartType(chartType);
  }

  onMonthChange(selectedMonth: number): void {
    this.firestoreService.changeMonth(selectedMonth);
    // Fetch data based on the selected month
  }

  selectedMonth = new Date().toISOString().slice(0, 7); // Default to current month


  // Get the current month name and year in "Month Year" format
  get formattedDate(): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    return this.currentDate.toLocaleDateString('en-US', options);
  }

  // Move to the previous month
  prevMonth(): void {
    const currentMonth = this.currentDate.getMonth();
    this.currentDate.setMonth(currentMonth - 1);
  }

  // Move to the next month
  nextMonth(): void {
    const currentMonth = this.currentDate.getMonth();
    this.currentDate.setMonth(currentMonth + 1);
  }

 
}
