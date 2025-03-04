import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { Income } from '../models';
import { Timestamp } from 'firebase/firestore';
import { FirestoreService } from '../firestore.service';
import { BudgetService } from '../budget.service';

@Component({
  selector: 'app-add-income',
  templateUrl: './add-income.page.html',
  styleUrls: ['./add-income.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class AddIncomePage implements OnInit {

  constructor(private router: Router, private firestoreService: FirestoreService, private budgetService: BudgetService) { }

  ngOnInit() {
  }

  income_categories: string[] = ['Salary', 'Business', 'Gift', 'Other','Investment','Gig'];
  categ: string = '';
  amount: number | null = null;
  description: string = '';
  selectedDate = new Date().toISOString().split('T')[0];
  
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
        Date: Timestamp.fromDate(new Date(this.selectedDate)),
        Description: this.description,
        Category: this.categ,
        Amount: this.amount!,
        userId: userId!
      }
          
      this.firestoreService.addIncome(userId!, income);
      this.budgetService.signalChange('Income');
      this.router.navigate(['/tabs/transactions']);
    }

}
