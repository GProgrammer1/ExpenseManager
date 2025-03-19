import {
  AfterViewInit,
  Component,
  ElementRef,
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
  PieController,
  Title,
  Tooltip,
} from 'chart.js';
import { Observable, Subscription, combineLatest, debounceTime, defaultIfEmpty, of, switchMap, tap } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { BudgetService } from '../services/budget.service';
import { IncomeService } from '../services/income.service';
import { FirestoreService } from '../services/firestore.service';
import { Income } from '../models';
import { CategoryService } from '../services/category.service';

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
  selector: 'app-incomes-stats',
  templateUrl: './incomes-stats.page.html',
  styleUrls: ['./incomes-stats.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class IncomesStatsPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chart') chart!: ElementRef;
  noData = false;
  loading = true;
  labels = ['Salary', 'Investment', 'Gift', 'Other', 'Gig', 'Business'];
  selectedMonth$!: Observable<number>;
  data: Record<string, number> = {};
  incomePercentages: { category: string; percentage: number }[] = [];
  chartType = 'pie';
  income$!: Observable<Income[]>;
  chartType$: Observable<string>;
  chartSubscription!: Subscription;
  private myChart: Chart | null = null;

  constructor(
    private incomeService: IncomeService,
    private firestoreService: FirestoreService,
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
    this.chartSubscription = this.selectedMonth$
      .pipe(
        switchMap((month) => {
          this.loading = true;
          return this.incomeService.incomes$.pipe(
            defaultIfEmpty([]),
            switchMap((incomes) => {
              return incomes.length > 0
                ? of(incomes.filter((expense) => new Date(expense.date.seconds * 1000).getMonth() === month))
                : (this.incomeService.fetchIncomes(localStorage.getItem('userId')!, month) as Observable<Income[]>);
            })
          );
        }),
        tap((expenses) => this.processIncomes(expenses)),
        debounceTime(500)
      )
      .subscribe();
  }

  private processIncomes(incomes: Income[]): void {
    this.noData = incomes.length === 0;
    this.data = this.labels.reduce((acc: { [category: string]: number }, label: any) => {
      acc[label] = 0;
      return acc as Record<string, number>;
    }, {});

    incomes.forEach((income) => {
      this.data[income.category] += income.amount;
    });

    const total = Object.values(this.data).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      this.noData = true;
      return;
    }
    this.incomePercentages = this.labels.map((label) => ({
      category: label,
      percentage: this.data[label] / total,
    }));

    if (this.myChart) {
      this.updateChart(this.myChart, Object.values(this.data));
      return;
    }
    this.createChart();
  }

  updateChart(chart: Chart, newData: number[]) {
    chart.data.datasets[0].data = newData;
    chart.data.datasets[0].backgroundColor = this.generateHexColors(this.labels.length);
    chart.update('none');
    this.loading = false;
  }

  private createChart(): void {
    if (this.myChart) this.myChart.destroy();
    this.noData = Object.values(this.data).every((value) => value === 0);

    if (this.noData) {
      this.incomePercentages = this.labels.map((label) => ({
        category: label,
        percentage: 0,
      }));
      this.loading = false;
      return;
    }

    const total = Object.values(this.data).reduce((sum, value) => sum + value, 0);
    const arrayData = this.labels.map((label) => this.data[label] || 0);

    this.incomePercentages = arrayData.map((value, index) => ({
      category: this.labels[index],
      percentage: value / total,
    }));

    if (this.chartType === 'bar') {
      this.myChart = new Chart(this.chart.nativeElement, {
        type: this.chartType as 'pie' | 'bar' | 'doughnut' | 'line',
        data: {
          labels: this.labels,
          datasets: [
            {
              label: 'Expenses',
              data: arrayData,
              backgroundColor: this.generateHexColors(this.labels.length),
            },
          ],
        },
        options: {
          scales: {
            x: {
              ticks: {
                autoSkip: false,
              },
            },
            y: {
              ticks: {
                callback: function (value: string | number) {
                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                  return `$${numValue >= 1e6 ? numValue.toExponential(2) : numValue.toLocaleString()}`;
                },
              },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    } else {
      this.myChart = new Chart(this.chart.nativeElement, {
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
      const hue = (i * (360 / count)) % 360;
      const saturation = 80;
      const lightness = i % 2 === 0 ? 45 : 55;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
  }

  ngOnDestroy(): void {
    this.myChart?.destroy();
  }
}