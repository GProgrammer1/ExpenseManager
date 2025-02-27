import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { GoalsService } from '../goals.service';
import { Goal } from '../models';
import { Timestamp } from 'firebase/firestore';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-add-goal',
  templateUrl: './add-goal.page.html',
  styleUrls: ['./add-goal.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule,RouterLink]
})
export class AddGoalPage implements OnInit {

  name = '';
  description = '';
  // deadline = new Date().toISOString();
  type: 'Expense' | 'Income'= 'Income';
  constructor(private goalService: GoalsService, private router: Router) { }

  ngOnInit() {
  }

  async addGoal() {
    const userId = localStorage.getItem('userId');
    console.log("User id: ", userId);
    
    if (this.name && this.description) {
      const goal : Goal = {
        name: this.name,
        description: this.description,
        // deadline: Timestamp.fromDate(new Date(this.deadline)),
        type: this.type,
        userId: userId!
      }

      console.log("Goal: ", goal);
      
      await this.goalService.addGoal(goal);
      this.router.navigate(['/tabs/goals']);
    }
    else {
      alert('Please fill in all the fields');
      return;
    }
        
  }

}
