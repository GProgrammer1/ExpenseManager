import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { GoalsService } from '../services/goals.service';
import { Goal } from '../models';
import { Timestamp } from 'firebase/firestore';
import { Router, RouterLink } from '@angular/router';
@Component({
  selector: 'app-add-goal',
  templateUrl: './add-goal.page.html',
  styleUrls: ['./add-goal.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddGoalPage implements OnInit {

  name = '';
  description = '';
  targetAmount: number | null= null;
  priority: string | null = null;
  deadline = new Date().toISOString();
  type: 'Expense' | 'Income'= 'Income';
  today = new Date().toISOString(); 
  constructor(private goalService: GoalsService, private router: Router) { }

  ngOnInit() {
  }

  async addGoal() {
    const userId = localStorage.getItem('userId');
    console.log("User ID:", userId);
  
    // Basic validation for required fields
    if (!this.name?.trim() || !this.description?.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
  
    if (!this.targetAmount || this.targetAmount <= 0) {
      alert('Please enter a valid target amount greater than 0.');
      return;
    }
  
    if (!this.deadline) {
      alert('Please select a deadline.');
      return;
    }
  
    if (!this.priority) {
      alert('Please select a priority');
      return;
    }
  
    // Construct goal object
    const goal: Goal = {
      targetAmount: this.targetAmount,
      id: '',
      name: this.name.trim(),
      description: this.description.trim(),
      deadline: Timestamp.fromDate(new Date(this.deadline)),
      type: this.type,
      userId: userId!,
      priority: this.priority
    };
  
    console.log("Goal:", goal);
  
    this.goalService.addGoal(goal).subscribe({
      next: (res) => {
        console.log('Goal added:', res.goal);
        this.goalService.goalSubject.next([...this.goalService.goalSubject.value, res.goal]);
        this.router.navigate(['/tabs/goals']);
      },
      error: (error) => {
        console.error('Error adding goal:', error);
        alert('An error occurred while adding the goal. Please try again.');
      }
    });
  }
  
}
