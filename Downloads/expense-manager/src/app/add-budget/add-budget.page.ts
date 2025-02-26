import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import {IonicModule} from '@ionic/angular';
import { BudgetService } from '../budget.service';
import { Budget } from '../models';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-add-budget',
  templateUrl: './add-budget.page.html',
  styleUrls: ['./add-budget.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class AddBudgetPage implements OnInit {

  expense_categories: string[] = ['Food', 'Transportation', 'Entertainment', 'Health', 'Education', 'Other','Housing'];
  categ: string = '';
  amount: number | null = null;
  selectedMonth = new Date().getMonth() + 1;
  rows!: {category: string, amount: number}[];
  
  constructor(private budgetService: BudgetService, private router: Router) {
    this.rows = [];
   }

  ngOnInit() {
  }

  removeRow(row: { category: string, amount: number }) {
    const index = this.rows.indexOf(row);
    this.rows.splice(index, 1);
  }
  
 addRow() {
    if (!this.categ || this.amount === null) {
      alert('Please fill in both Category and Amount.');
      return;
    }

    // Add the new row to the rows array
    this.rows.push({ category: this.categ, amount: Number(this.amount) });
    
    // Reset the input fields
    this.categ = '';
    this.amount = null;
  }

  checkIfSelected(category: string) {
    return this.rows.some(row => row.category === category);
  }

  add() {

    const userId = localStorage.getItem('userId');
     let spendings : {[key:string]: number} = {};    
        let totalBudget = 0;
        for (let i = 0; i < this.rows.length; i++) {
          const row = this.rows[i];
          console.log("Row: ", row);
          
          if (isNaN(row.amount) || row.amount! < 0) {
            alert('Please enter a valid amount');
            return; // This will exit the function
          }
          
          spendings[row.category] = row.amount;
          totalBudget += row.amount;
        }
        console.log("Spendings: ", spendings);
        console.log("Total Budget: ", totalBudget);
        console.log("Selected month: ", this.selectedMonth);
        
        
        let budget :Budget = {
          spendings,
          month: this.selectedMonth,
          totalBudget,
          userId: userId!
        };
    
        if (Object.keys(spendings).length === 0) {
          alert('Please add at least one row');
          return;
        }
        console.log("Budget: ", budget);
        this.budgetService.addBudget(userId!, budget);
        this.router.navigate(['/tabs/budget']);
  }
}
