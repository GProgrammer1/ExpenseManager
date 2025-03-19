import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { GeminiService } from '../services/gemini.service';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import {User as AppUser, Expense, Income, Note} from '../models';
import { ExpenseService } from '../services/expense.service';
import { IncomeService } from '../services/income.service';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import { NoteService } from '../services/note.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  totalBalance$ : Observable<number>;
  totalBalance: number = 0;
  hasScrolled = false;
  ngOnInit() {
  }
  debt = {
    title: '',
    interestRate: 0,
    dueDate: '',
    amountOwed: null,
  };

  @ViewChild('debtPlan', {static: false}) debtPlan!: any;

  repaymentPlan!: string;
  expenses$: Observable<Expense[]>;
  incomes$: Observable<Income[]>;

  ngAfterViewChecked() {
    if (this.repaymentPlan && this.debtPlan && !this.hasScrolled) {
      this.scrollToRepaymentPlan();
      this.hasScrolled = true;
    }
  }

  async presentAddNoteDialog() {
  const alert= await this.alertCtrl.create({
      
    header: 'Give your note a title',
    inputs: [
      {
        name: 'title',
        type: 'text',
        placeholder: 'Title'
      }
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => {
          console.log('Confirm Cancel');
        }
      }, {
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
      next: (response: any) => {
        this.presentToast('✔️ Note saved successfully','success');
      },
      error: (error: any) => {
        console.error("Error saving note: ", error);
        this.presentToast('⚠️ Error saving note. Please try again.','danger');
      }
    });

  };

  presentToast(message: string, color: 'success' | 'danger') {
    this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      
      color
    }).then((toast) => {
      toast.present();
    })
  }

  constructor(private toastController: ToastController, private geminiService: GeminiService, private configService: ConfigService,
    private authService: AuthService, private expenseService: ExpenseService, private incomeService: IncomeService, private alertCtrl:  AlertController,
    private noteService:NoteService) {
   
   {
    const id = localStorage.getItem('userId');
    authService.getUserByuid(id!).subscribe({
      next: (user: AppUser) => {
        this.personalInfo = JSON.parse(JSON.stringify(user));
        this.savings = this.personalInfo.savings;
      }
    });

    this.expenses$ = expenseService.getExpenses(id!);
    this.incomes$ = incomeService.getIncomes(id!);

    this.totalBalance$ = combineLatest([this.expenses$, this.incomes$]).pipe(
      map(([expenses, incomes]) => {
        return incomes.reduce((acc, income) => acc + income.amount, 0) - expenses.reduce((acc, expense) => acc + expense.amount, 0) + this.savings!;
      }
    ));

    this.totalBalance$.subscribe({
      next: (balance: number) => {
        this.totalBalance = balance;
      }
    });


  }
  }

  async generatePlan() {
    this.generatingPlan = true;
    // Simulate calling the AI backend (Gemini or another service)
    try {
      this.getRepaymentPlanFromAI();
     
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error generating repayment plan. Please try again.',
        duration: 2000,
        color: 'danger',
      });
      toast.present();
    }
  }

  getRepaymentPlanFromAI()  {
    this.geminiService.debtPlanAdvice(this.debt, this.personalInfo, this.totalBalance).subscribe({
      next: (response: any) => {
        console.log("Response from Gemini: ", response);
        this.generatingPlan = false;
        
        this.repaymentPlan = (response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response')
          .replace(/\*+/g, ''); 
  
        this.repaymentPlan = this.repaymentPlan
          .split('\n')
          .map(line => {
            const match = line.match(/^(\d+\.)?\s*(.*?):\s*(.*)/);  
            if (match) {
              
              return `${match[2]}: ${match[3]}`;
            }
            return line; 
          })
          .join('\n\n'); 
  
        console.log("Formatted Repayment Plan: ", this.repaymentPlan);
        this.scrollToRepaymentPlan();
      },
      error: (error: any) => {
        console.error("Error from Gemini: ", error);
      }
    }); 
  }

  scrollToRepaymentPlan() {
    console.log("Debt Plan: ", this.debtPlan);
    
    if (this.debtPlan) {
      this.debtPlan.el.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      window.scrollBy(0, -100); // Adjust the offset as needed

    }
  }
}
