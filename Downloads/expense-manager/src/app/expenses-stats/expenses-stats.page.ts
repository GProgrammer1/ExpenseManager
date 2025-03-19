import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  
  LinearScale,
  LineController,
  LineElement,
  PieController,
  Title,
  Tooltip,
} from 'chart.js';
import { FirestoreService } from '../services/firestore.service';
import { debounceTime, defaultIfEmpty, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { ExpenseService } from '../services/expense.service';
import { Expense } from '../models';


Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PieController,
  BarController,
  BarElement,

);

@Component({
  selector: 'app-expenses-stats',
  templateUrl: './expenses-stats.page.html',
  styleUrls: ['./expenses-stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ExpensesStatsPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chart') chart!: ElementRef<any>;
  noData = false;
  loading = true;
  labels = [
    'Food',
    'Transportation',
    'Utilities',
    'Personal Care',
    'Entertainment',
    'Health',
    'Other',
    'Clothing',
    'Education',
    'Housing',
    'Insurance',
  ];
  selectedMonth$!: Observable<number>;
  selectedMonth = new Date().getMonth();
  data: Record<string, number> = {};
  expensePercentages: { category: string; percentage: number }[] = [];
  myChart1: any;
  chartType = 'pie';
  chartSubscription: Subscription | null  = null;
  chartType$: Observable<string>; 
  constructor(
    private firestoreService: FirestoreService,
    private expenseService: ExpenseService,
  ) {
    this.selectedMonth$ = this.firestoreService.month$;
    this.chartType$ = this.firestoreService.chartType$;
    this.chartType$.subscribe((chartType) => {
      this.chartType = chartType;
      this.createChart();
    });
  }

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.loading = true;
     this.chartSubscription =  this.selectedMonth$
        .pipe(
          switchMap((month) => {
            this.loading = true;
            return this.expenseService.expenses$.pipe(
              defaultIfEmpty([]),
              switchMap((expenses) => {
               return expenses.length > 0 ? of(expenses.filter((expense) => new Date(expense.date.seconds * 1000).getMonth() === month))
                 : this.expenseService.fetchExpenses(localStorage.getItem('userId')!, month) as Observable<Expense[]>
              })
            
            )})
          ,
          tap((expenses) =>  this.processExpenses(expenses)),
          debounceTime(500)
        )
        .subscribe();
    
  }

  toggleChartType() {
    this.chartType = this.chartType === 'pie' ? 'bar' : 'pie';
    this.createChart();
  }
  private processExpenses(expenses: Expense[]) {
    this.noData = expenses.length === 0;
  
    this.data = this.labels.reduce((acc, label) => {
      acc[label] = 0;
      return acc;
    }, {} as Record<string, number>);
  
    expenses.forEach((expense) => {
      if (this.data.hasOwnProperty(expense.category)) {
        this.data[expense.category] += expense.amount;
      }
    });
  
    console.log("Data: ", this.data);
    if (Object.values(this.data).every((value) => value === 0)) {
      this.noData = true;
      this.loading = false;
      return;
    }
    const arrayData = this.labels.map((label) => this.data[label] || 0);
    console.log("Array data: ", arrayData);
  
    const total = arrayData.reduce((sum, value) => sum + value, 0);
    this.expensePercentages = arrayData.map((value, index) => ({
      category: this.labels[index],
      percentage: total > 0 ? value / total : 0,
    }));
    console.log("Expense percentages: ", this.expensePercentages);
  
    if (this.myChart1) {
      this.updateChart(this.myChart1, arrayData);
      return;
    }
    this.createChart();
  }
  
  updateChart(chart: Chart, newData: number[]) {
    console.log("New data: ", newData);
    chart.data.datasets[0].data = newData;
    chart.data.datasets[0].backgroundColor = this.generateHexColors(this.labels.length);
    chart.update('active');
    this.loading = false;
  }
  

  private createChart() {
    if (this.myChart1) {
      this.myChart1.destroy();
    }
    this.noData = Object.values(this.data).every((value) => value === 0);
    console.log("NO DATA EXPENSES: ", this.data);
    

    if (this.noData) {
      this.expensePercentages = this.labels.map((label) => ({ category: label, percentage: 0 }));
      this.loading = false;
      return;
    }

    const total = Object.values(this.data).reduce((sum, value) => sum + value, 0);
    const arrayData = this.labels.map((label) => this.data[label] || 0);

    this.expensePercentages = arrayData.map((value, index) => ({
      category: this.labels[index],
      percentage: value / total,
    }));

    console.log("Array data: ", arrayData);
    console.log("Labels: ", this.labels);
    
    
    if (this.chartType === 'bar') {
    this.myChart1 = new Chart(this.chart.nativeElement, {
      type: this.chartType as 'pie' | 'bar' | 'doughnut' | 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'Expenses',
            data: arrayData,
            animation: {
              duration: 1000,
              easing: 'easeInOutCubic'
            
            },
            backgroundColor: this.generateHexColors(this.labels.length),
          }
        ],
      },
      options: {
        scales: {
          x: {
            ticks: {
              autoSkip: false,  // Ensures all labels are displayed
            }
          },
          y: {
            ticks: {
              callback: function (value: string | number) {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                return `$${numValue >= 1e6 ? numValue.toExponential(2) : numValue.toLocaleString()}`;  // Adds a "$" sign to each y-axis value
              }
            },
          }
        },
        responsive: true,
        maintainAspectRatio: false,
       
      },
    });
  } else {
    this.myChart1 = new Chart(this.chart.nativeElement, {
      type: this.chartType as 'pie' | 'bar' | 'doughnut' | 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            data: arrayData,
            
            backgroundColor: this.generateHexColors(this.labels.length),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const value = tooltipItem.raw as number;
                return `$${value >= 1e6 ? value.toExponential(2) : value.toLocaleString()}`;
              },
            },
          },
        },
      },
    });
  }
    
    this.loading = false;
  }    

  private generateHexColors(count: number): string[] {
    return Array.from({ length: count }, (_, i) => {
      const hue = (i * (360 / count)) % 360; // Evenly spaced hues
      const saturation = 80; // Higher saturation for vibrancy
      const lightness = i % 2 === 0 ? 45 : 55; // Alternate lightness for better contrast
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
  }
  
  changeChartType(type: string) {
    this.chartType = type;
    this.createChart();
  }

  ngOnDestroy(): void {
    this.myChart1?.destroy();
    if (this.chartSubscription) {
      this.chartSubscription.unsubscribe();
    }
  }
}