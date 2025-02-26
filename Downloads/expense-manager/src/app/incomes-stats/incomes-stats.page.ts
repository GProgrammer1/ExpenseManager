import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { FirestoreService } from '../firestore.service';
import { ActivatedRoute } from '@angular/router';
import { Chart, PieController } from 'chart.js';
import { Observable } from 'rxjs';
import { BudgetService } from '../budget.service';
import {ViewWillLeave} from '@ionic/angular';


Chart.register(PieController);
@Component({
  selector: 'app-incomes-stats',
  templateUrl: './incomes-stats.page.html',
  styleUrls: ['./incomes-stats.page.scss'],
  standalone: true,
  imports: [ IonLabel, IonContent, IonTitle, IonSpinner,  CommonModule, FormsModule]
})
export class IncomesStatsPage implements OnInit,AfterViewInit, OnDestroy {


    noData: boolean = false;
    loading: boolean = true;
    labels: string[] = [];
    selectedMonth$!: Observable<number>;
    selectedMonth: number = new Date().getMonth();
    changedBudget$!: Observable<'Expense' | 'Income' | null>;
    incomePercentages!: {category: string, percentage: number}[] ;
    @ViewChild('myChart2') myChartComponent: any;
    public myChart2: any;
  
    constructor(private firestoreService: FirestoreService, private route: ActivatedRoute,
      private budgetService: BudgetService
    ) {
      this.changedBudget$ = budgetService.changedBudget$;
      this.selectedMonth$ = firestoreService.month$; 
      this.selectedMonth$.subscribe(month => {
      this.selectedMonth = month;
      this.createChart();
      this.changedBudget$.subscribe(type => {
        if (type === 'Income') {
          this.createChart();
        }
    });
    });
     }

    
  
    ngOnInit() {
      // this.createChart();
    }

    ngOnDestroy(): void {
      if (this.myChart2) {
        this.myChart2.destroy();
        this.myChart2 = null;
      }
    }
    ngAfterViewInit(): void {
      this.createChart();
    }


    ViewWillLeave() {
      if (this.myChart2) {
        this.myChart2.destroy();
        this.myChart2 = null;
      }
    }
  
    async createChart() {
      this.loading = true;
      this.noData = false;
  
      if (this.myChart2) {
        this.myChart2.destroy();
        this.myChart2 = null;
      }
  
      const uid = localStorage.getItem('userId')!;
      this.labels = await this.firestoreService.getCategories('Income');
      const data = await this.firestoreService.getIncomeData(uid, this.selectedMonth);
  
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
      this.incomePercentages = arrayData.map((value, index) => {
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
                return '$' + tooltipItem.raw.toFixed(2); // Use toFixed to show two decimal places
              }
            }
          }
        }
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
          this.myChart2 = new Chart('myChart2', {
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
