import { AfterViewInit, Component, createComponent, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArcElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, PieController, registerables, Title, Tooltip } from 'chart.js';
import { FirestoreService } from '../firestore.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { BudgetService } from '../budget.service';
import {IonicModule} from '@ionic/angular';

Chart.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, DoughnutController, PieController);
@Component({
  selector: 'app-expenses-stats',
  templateUrl: './expenses-stats.page.html',
  styleUrls: ['./expenses-stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ExpensesStatsPage implements OnInit, OnDestroy, AfterViewInit{

  noData: boolean = false;
  loading: boolean = true;
  labels: string[] = [];
  selectedMonth$!: Observable<number>;
  selectedMonth: number = new Date().getMonth();

  changedBudget$!: Observable<'Expense' | 'Income' | null>;
  expensePercentages!: {category: string, percentage: number}[] ;
  public myChart1: any;

  constructor(private firestoreService: FirestoreService, private route: ActivatedRoute,
    private budgetService: BudgetService
  ) {
    this.changedBudget$ = budgetService.changedBudget$;
    this.selectedMonth$ = firestoreService.month$; 
    this.selectedMonth$.subscribe(month => {
      this.selectedMonth = month;
      this.createChart();
    });

    this.changedBudget$.subscribe(type => {
      if (type === 'Expense') {
        this.createChart();
      }
    }); 
   }

  ngOnInit() {
    // this.createChart();
  }

  ngAfterViewInit(): void {
    this.createChart();
  }
  ngOnDestroy(): void {
    if (this.myChart1) {
      this.myChart1.destroy();
      this.myChart1 = null;
    }
  }

  async createChart() {
    this.loading = true;
    this.noData = false;

    if (this.myChart1) {
      this.myChart1.destroy();
      this.myChart1 = null;
    }

    const uid = localStorage.getItem('userId')!;
    this.labels = await this.firestoreService.getCategories('Expense');
    const data = await this.firestoreService.getExpenseData(uid, this.selectedMonth);

    if (Object.keys(data).length === 0) {
      this.noData = true;
      this.loading = false;
      return;
    }
    let arrayData = []; 
    let total = 0;
    arrayData = this.labels.map((label) => {
      const value = data[label] || 0;
      total += value;
      return value;
    });

    console.log("Array Data: ", arrayData);
    this.expensePercentages = arrayData.map((value, index) => {
      return {
        category: this.labels[index],
        percentage: (value / total) 
      };
    });

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            // Format the tooltip label to include the '$' symbol
            label: function(tooltipItem: any) {
              console.log("Tooltip itemraw: ", tooltipItem.raw);
              
              return '$' + tooltipItem.raw.toFixed(2); // Use toFixed to show two decimal places
            }
          }
        }
      },
      layout: {
        padding: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      },
    };

    const chartData = {
      labels: this.labels,
      datasets: [{
        data: arrayData,
        backgroundColor: this.generateHexColors(this.labels.length)
      }]
    };
    try {
    setTimeout(() => {
      this.myChart1 = new Chart('myChart1', {
      type: 'pie',
      data: chartData,
      options: options
    });
  },500);
  } catch (error) {
    this.createChart();
  }
    this.loading = false;

  }

  generateHexColors(n: number): string[] {
    const colors: string[] = [];
    const step = Math.floor(0xffffff / n); // Ensure colors are spaced evenly
  
    for (let i = 0; i < n; i++) {
      const colorValue = (step * i) % 0xffffff; // Calculate the color value
      const hexColor = `#${colorValue.toString(16).padStart(6, '0')}`;
      colors.push(hexColor);
    }
  
    return colors;
  }
}
