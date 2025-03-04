// import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonSpinner, IonIcon } from '@ionic/angular/standalone';
// import { FirestoreService } from '../firestore.service';
// import { ActivatedRoute } from '@angular/router';
// import { Chart, PieController } from 'chart.js';
// import { Observable } from 'rxjs';
// import { BudgetService } from '../budget.service';
// import {ViewWillLeave} from '@ionic/angular';
// import { user } from '@angular/fire/auth';


// Chart.register(PieController);
// @Component({
//   selector: 'app-incomes-stats',
//   templateUrl: './incomes-stats.page.html',
//   styleUrls: ['./incomes-stats.page.scss'],
//   standalone: true,
//   imports: [IonIcon,  IonLabel, IonContent, IonTitle, IonSpinner,  CommonModule, FormsModule]
// })
// export class IncomesStatsPage implements OnInit,AfterViewInit, OnDestroy {

//     data: Record<string, number> = {};
//     noData: boolean = false;
//     loading: boolean = true;
//     labels: string[] = [];
//     selectedMonth$!: Observable<number>;
//     selectedMonth: number = new Date().getMonth();
//     changedBudget$!: Observable<'Expense' | 'Income' | null>;
//     incomePercentages!: {category: string, percentage: number}[] ;
//     @ViewChild('myChart2') myChartComponent: any;
//     public myChart2: any;
  
//     constructor(private firestoreService: FirestoreService, private route: ActivatedRoute,
//       private budgetService: BudgetService
//     ) {
//       this.changedBudget$ = budgetService.changedBudget$;
//       this.selectedMonth$ = firestoreService.month$; 
//       this.selectedMonth$.subscribe(month => {
//         if (this.myChart2) {
//           this.myChart2.destroy();
//           this.myChart2 = null;
//         }
//       this.selectedMonth = month;
//       this.createChart();
//       });
      
//       this.changedBudget$.subscribe(type => {
//         (async() => {
//           const userId= localStorage.getItem('userId');
//           this.data = await this.firestoreService.getIncomeData(userId!, this.selectedMonth);
          
//           this.updateChart();
        
//           });
        
//     });

//     }

//     updateChart() {
      
//       if (Object.keys(this.data).length === 0) {
//         this.noData = true;
//         this.loading = false;
//         return;
//       }
      
//       let arrayData = []; 
//       let total = 0;
//       arrayData = this.labels.map((label) => {
//         const value = this.data[label] || 0;
//         total += value;
//         return value;
//       });
  
//       console.log("Array Data: ", arrayData);
//       this.incomePercentages = arrayData.map((value, index) => {
//         return {
//           category: this.labels[index],
//           percentage: (value / total)
//         };
//       });

//       console.log("My chart2 in updatechart is; ", this.myChart2);
      
//       if (this.myChart2){
//         this.myChart2.data.datasets[0].data = arrayData;
//         this.myChart2.update();
//         console.log("My chart2 updated: ", this.myChart2);
        
//       }
//     }
    
  
//     ngOnInit() {
//       // this.firestoreService.currentTabSubject.next('Incomes');
//       // this.firestoreService.currentTab$.subscribe(tab => {
//       //   if (tab === 'Incomes') {
//       //     this.createChart();
//       //   }
//       //   else {
//       //     if (this.myChart2) {
//       //       this.myChart2.destroy();
//       //       this.myChart2 = null;
//       //     }
//       //   }
//       // }
//       // );
//     }
//     ngOnDestroy(): void {
//       console.log("Destroying chart", this.myChart2);
      
//       if (this.myChart2) {
//         this.myChart2.destroy();
//         this.myChart2 = null;
//       }
//     }
//     ngAfterViewInit(): void {
//       // console.log("Create chart method called in ngAfterViewInit");
//       // if (this.myChart2) {
//       //   this.myChart2.destroy();
//       //   this.myChart2 = null;
//       // }
//       // this.createChart();
//       // this.firestoreService.currentTabSubject.next('Incomes');
//     }


//     ViewWillLeave() {
//       if (this.myChart2) {
//         this.myChart2.destroy();
//         this.myChart2 = null;
//       }
//     }
  
//     async createChart() {
//       this.loading = true;
//       this.noData = false;
  
//       if (this.myChart2) {
//         this.myChart2.destroy();
//         this.myChart2 = null;
//       }
  
//       const uid = localStorage.getItem('userId')!;
//       this.labels = await this.firestoreService.getCategories('Income');
//       this.data = await this.firestoreService.getIncomeData(uid, this.selectedMonth);
  
//       if (Object.keys(this.data).length === 0) {
//         this.noData = true;
//         this.loading = false;
//         return;
//       }
      
//       let arrayData = []; 
//       let total = 0;
//       arrayData = this.labels.map((label) => {
//         const value = this.data[label] || 0;
//         total += value;
//         return value;
//       });
  
//       console.log("Array Data: ", arrayData);
//       this.incomePercentages = arrayData.map((value, index) => {
//         return {
//           category: this.labels[index],
//           percentage: (value / total)
//         };
//       });
  
//       const options = {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           tooltip: {
//             callbacks: {
//               // Format the tooltip label to include the '$' symbol
//               label: function(tooltipItem: any) {
//                 return '$' + tooltipItem.raw.toFixed(2); // Use toFixed to show two decimal places
//               }
//             }
//           }
//         }
//       };
  
//       const chartData = {
//         labels: this.labels,
//         datasets: [{
//           data: arrayData,
//           backgroundColor: this.generateHexColors(this.labels.length)
//         }]
//       };
//       console.log("My chart2 is: ", this.myChart2);
      
//       try {
//         setTimeout(() => {
//           this.myChart2 = new Chart('myChart2', {
//           type: 'pie',
//           data: chartData,
//           options: options
//         });
//         console.log("My chart2 will be: ",this.myChart2);
        
//       },500);
//     } catch (error) {
//       // this.createChart();
//     }
    

//       this.loading = false;
  
//     }
  
//     generateHexColors(n: number): string[] {
//       const colors: string[] = [];
      
//       for (let i = 0; i < n; i++) {
//         const hue = (i * 360) / n;  // Evenly distribute colors across the color wheel
//         const saturation = 70;  // Keep saturation high for vibrancy
//         const lightness = 50;   // Keep it in the middle to avoid too dark or too light colors
    
//         const hslColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
//         colors.push(hslColor);
//       }
    
//       return colors;
//     }
    

// }
import {
  AfterViewInit,
  Component,
  createComponent,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ArcElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  PieController,
  registerables,
  Title,
  Tooltip,
} from 'chart.js';
import { FirestoreService } from '../firestore.service';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, debounceTime, filter, Observable, tap } from 'rxjs';
import { BudgetService } from '../budget.service';
import { IonicModule } from '@ionic/angular';

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  DoughnutController,
  PieController
);
@Component({
  selector: 'app-incomes-stats',
  templateUrl: './incomes-stats.page.html',
  styleUrls: ['./incomes-stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class IncomesStatsPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chart') chart!: ElementRef<any>;
  noData: boolean = false;
  loading: boolean = true;
  labels: string[] = [];
  selectedMonth$!: Observable<number>;
  selectedMonth: number = new Date().getMonth();

  changedBudget$!: Observable<'Expense' | 'Income' | null>;
  incomePercentages!: { category: string; percentage: number }[];
  public myChart2: any;

  constructor(
    private firestoreService: FirestoreService,
    private route: ActivatedRoute,
    private budgetService: BudgetService
  ) {
    this.changedBudget$ = this.budgetService.changedBudget$;
    this.selectedMonth$ = this.firestoreService.month$;
  }

  ngOnInit() {
    // this.createChart();
  }

  ngAfterViewInit(): void {
    combineLatest([
      this.selectedMonth$.pipe(
        tap((month: any) => {
          this.selectedMonth = month;
          console.log("Create chart method because of month change");
          
          this.createChart();
        })
      ),
      this.changedBudget$.pipe(filter((type: any) => type === 'Income')),
    ])
      .pipe(
        debounceTime(500) // reduce the number of calls - optional
      )
      .subscribe(() => {
        this.createChart();
      });
  }
  ngOnDestroy(): void {
    if (this.myChart2) {
      this.myChart2.destroy();
      this.myChart2 = null;
    }
  }

  async createChart() {
    this.incomePercentages = [];
    this.loading = true;
    this.noData = false;

    if (this.myChart2) {
      this.myChart2.destroy();
      this.myChart2 = null;
    }

    const uid = localStorage.getItem('userId')!;
    this.labels = await this.firestoreService.getCategories('Income');
    const data = await this.firestoreService.getIncomeData(
      uid,
      this.selectedMonth
    );

    if (Object.keys(data).length === 0) {
      this.labels.forEach((label) => {
        this.incomePercentages.push({
          category: label,
          percentage: 0,
        });

      })      
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

    console.log('Array Data: ', arrayData);
    this.incomePercentages = arrayData.map((value, index) => {
      return {
        category: this.labels[index],
        percentage: value / total,
      };
    });

    console.log("Income percentages: ", this.incomePercentages);
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            // Format the tooltip label to include the '$' symbol
            label: function (tooltipItem: any) {
              console.log('Tooltip itemraw: ', tooltipItem.raw);

              return '$' + tooltipItem.raw.toFixed(2); // Use toFixed to show two decimal places
            },
          },
        },
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
      datasets: [
        {
          data: arrayData,
          backgroundColor: this.generateHexColors(this.labels.length),
        },
      ],
    };
    this.myChart2 = new Chart(this.chart.nativeElement, {
      type: 'pie',
      data: chartData,
      options: options,
    });
    this.loading = false;
  }

  generateHexColors(n: number): string[] {
    const colors: string[] = [];
  
    for (let i = 0; i < n; i++) {
      const hue = (i * 360) / n; // Spread colors evenly around the color wheel
      const saturation = 75; // Keep colors vibrant
      const lightness = 50; // Avoid colors that are too light or dark
  
      const hexColor = this.hslToHex(hue, saturation, lightness);
      colors.push(hexColor);
    }
  
    return colors;
  }
  
  // Helper function: Convert HSL to Hex
  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
  
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  
    return `#${f(0).toString(16).padStart(2, '0')}${f(8).toString(16).padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`;
  }
  
}