import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BudgetService } from '../services/budget.service';
import { Budget } from '../models';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-budget',
  templateUrl: './add-budget.page.html',
  styleUrls: ['./add-budget.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddBudgetPage implements OnInit {
  expense_categories: string[] = ['Food', 'Transportation', 'Entertainment', 'Health', 'Education', 'Other', 'Housing'];
  categ: string = '';
  amount: number | null = null;
  selectedMonth = new Date().getMonth() + 1;
  rows!: { category: string, amount: number }[];

  constructor(private budgetService: BudgetService, private router: Router) {
    this.rows = [];
  }

  ngOnInit() {}

  removeRow(row: { category: string, amount: number }) {
    const index = this.rows.indexOf(row);
    this.rows.splice(index, 1);
  }

  addRow() {
    if (!this.categ || this.amount === null) {
      alert('Please fill in both Category and Amount.');
      return;
    }

    this.rows.push({ category: this.categ, amount: Number(this.amount) });
    this.categ = '';
    this.amount = null;
  }

  checkIfSelected(category: string) {
    return this.rows.some(row => row.category === category);
  }

  add() {
    const userId = localStorage.getItem('userId');
    let spendings: { [key: string]: number } = {};
    let totalBudget = 0;

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];

      if (isNaN(row.amount) || row.amount! < 0) {
        alert('Please enter a valid amount');
        return;
      }

      spendings[row.category] = row.amount;
      totalBudget += row.amount;
    }

    let budget: Budget = {
      id: '',
      spendings,
      month: this.selectedMonth,
      totalBudget,
      userId: userId!
    };

    if (Object.keys(spendings).length === 0) {
      alert('Please add at least one row');
      return;
    }

    this.budgetService.addBudget(userId!, budget).subscribe({
      next: (res: any) => {
        if (this.budgetService.budgetSubject.value.some(b => b.month === res.budget.month)) {
          this.budgetService.budgetSubject.next(this.budgetService.budgetSubject.value.map(b => b.month === res.budget.month ? res.budget : b));
        } else {
          this.budgetService.budgetSubject.next([...this.budgetService.budgetSubject.value!, res.budget]);
        }
      },
      error: (err: any) => {
        console.error('Error adding budget:', err);
        
      }
    });

    this.router.navigate(['/tabs/budget']);
  }
}
