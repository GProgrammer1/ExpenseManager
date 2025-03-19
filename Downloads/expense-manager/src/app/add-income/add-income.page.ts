import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { Income } from '../models';
import { Timestamp } from 'firebase/firestore';
import { BudgetService } from '../services/budget.service';
import { IncomeService } from '../services/income.service';

@Component({
  selector: 'app-add-income',
  templateUrl: './add-income.page.html',
  styleUrls: ['./add-income.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class AddIncomePage implements OnInit {

  constructor(private router: Router, private budgetService: BudgetService, private incomeService: IncomeService) { }

  ngOnInit() {
  }

  income_categories: string[] = ['Salary', 'Business', 'Gift', 'Other','Investment','Gig'];
  categ: string = '';
  amount: number | null = null;
  description: string = '';
  selectedDate = new Date().toISOString();
  
  add() {
   console.log("Adding income");
      
      const userId = localStorage.getItem('userId');
      
      if (!this.amount) {
        alert('Please enter a valid amount');
        return;
      }
      if (isNaN(this.amount!) || this.amount! < 0) {
        alert('Please enter a valid amount');
        return;
      }
      if (!this.categ || !this.description) {
        alert('Please fill in all fields');
        return;
      }
      const income: Income = {
        id: '',
        date: Timestamp.fromDate(new Date(this.selectedDate)),
        description: this.description,
        category: this.categ,
        amount: this.amount!,
        userId: userId!
      }
          
      this.incomeService.addIncome(income).subscribe({
        next: (res: any) =>{
          console.log("Response: ", res);
          
          
          const income: Income = res.income;
          console.log("Income added: ", income);
          this.incomeService.incomeSubject.next([...this.incomeService.incomeSubject.value, income]);
          this.budgetService.signalChange('Income');
          
          this.router.navigate(['/tabs/transactions']);
         
        },
        error: (err: any) => {
          console.error("Error adding income: ", err);
        }
      });
    }

}
