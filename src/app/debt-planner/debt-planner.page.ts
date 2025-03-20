import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { GeminiService } from '../services/gemini.service';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { User as AppUser, Expense, Income, Note } from '../models';
import { ExpenseService } from '../services/expense.service';
import { IncomeService } from '../services/income.service';
import { combineLatest, map, Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { NoteService } from '../services/note.service';

@Component({
  selector: 'app-debt-planner',
  templateUrl: './debt-planner.page.html',
  styleUrls: ['./debt-planner.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DebtPlannerPage implements OnInit, AfterViewChecked {
  personalInfo!: AppUser;
  savings: number | null = 0;
  generatingPlan = false;
  today = new Date().toISOString();
  totalBalance$!: Observable<number>;
  totalBalance = 0;
  hasScrolled = false;

  debt = {
    title: '',
    interestRate: 0,
    dueDate: '',
    amountOwed: null,
  };

  @ViewChild('debtPlan', { static: false }) debtPlan!: any;

  repaymentPlan!: string;
  expenses$!: Observable<Expense[]>;
  incomes$!: Observable<Income[]>;

  ngOnInit() {}

  ngAfterViewChecked() {
    if (this.repaymentPlan && this.debtPlan && !this.hasScrolled) {
      this.scrollToRepaymentPlan();
      this.hasScrolled = true;
    }
  }

  async presentAddNoteDialog() {
    const alert = await this.alertCtrl.create({
      header: 'Give your note a title',
      inputs: [{
        name: 'title',
        type: 'text',
        placeholder: 'Title'
      }],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Ok',
          handler: (data) => {
            this.saveNote(data, this.repaymentPlan);
          }
        }
      ]
    });
    await alert.present();
  }

  saveNote(data: any, repaymentPlan: string) {
    const userId = localStorage.getItem('userId');
    const note: Note = {
      id: '',
      title: data.title,
      content: repaymentPlan,
      userId: userId!,
      date: Timestamp.fromDate(new Date())
    };
    this.noteService.saveNote(note).subscribe({
      next: () => this.presentToast('✔️ Note saved successfully', 'success'),
      error: () => this.presentToast('⚠️ Error saving note. Please try again.', 'danger')
    });
  }

  presentToast(message: string, color: 'success' | 'danger') {
    this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color
    }).then(toast => toast.present());
  }

  constructor(
    private toastController: ToastController,
    private geminiService: GeminiService,
    private configService: ConfigService,
    private authService: AuthService,
    private expenseService: ExpenseService,
    private incomeService: IncomeService,
    private alertCtrl: AlertController,
    private noteService: NoteService
  ) {
    const id = localStorage.getItem('userId');
    if (id) {
      this.authService.getUserByuid(id).subscribe({
        next: (user: AppUser) => {
          this.personalInfo = user;
          this.savings = this.personalInfo.savings;
        }
      });
      this.expenses$ = this.expenseService.getExpenses(id);
      this.incomes$ = this.incomeService.getIncomes(id);
      this.totalBalance$ = combineLatest([this.expenses$, this.incomes$]).pipe(
        map(([expenses, incomes]) => incomes.reduce((acc, income) => acc + income.amount, 0) -
          expenses.reduce((acc, expense) => acc + expense.amount, 0) + (this.savings || 0))
      );
      this.totalBalance$.subscribe({
        next: (balance: number) => this.totalBalance = balance
      });
    }
  }

  async generatePlan() {
    this.generatingPlan = true;
    try {
      this.getRepaymentPlanFromAI();
    } catch {
      const toast = await this.toastController.create({
        message: 'Error generating repayment plan. Please try again.',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  }

  getRepaymentPlanFromAI() {
    this.geminiService.debtPlanAdvice(this.debt, this.personalInfo, this.totalBalance).subscribe({
      next: (response: any) => {
        this.generatingPlan = false;
        this.repaymentPlan = (response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response')
          .replace(/\*+/g, '')
          .split('\n')
          .map((line: any) => {
            const match = line.match(/^(\d+\.)?\s*(.*?):\s*(.*)/);
            return match ? `${match[2]}: ${match[3]}` : line;
          })
          .join('\n\n');
        this.scrollToRepaymentPlan();
      }
    });
  }

  scrollToRepaymentPlan() {
    if (this.debtPlan) {
      this.debtPlan.el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      window.scrollBy(0, -100);
    }
  }
}
