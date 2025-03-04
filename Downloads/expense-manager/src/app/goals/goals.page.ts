import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem } from '@ionic/angular/standalone';
import { Observable, of } from 'rxjs';
import { Goal } from '../models';
import { IonicModule } from '@ionic/angular';
import{ AlertController } from '@ionic/angular';
import { GoalsService } from '../goals.service';
import { IonModal } from '@ionic/angular';
import { GeminiService } from '../gemini.service';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-goals',
  templateUrl: './goals.page.html',
  styleUrls: ['./goals.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class GoalsPage implements OnInit {

  goals$!: Observable<Goal[]>;
  selectedGoal: Goal | null = null;
  response = '' ;
  generating: boolean = false;
  showPopup = false;
  generated = false;
  allowEdit = false;
  loading = true;
  focusedGoal: Goal | null = null;
  checkingProgress = false;

  @ViewChild('aiReportModal') aiReportModal!: IonModal;
  @ViewChild('desc') desc!: ElementRef;
  constructor(private alertController: AlertController, private goalsService: GoalsService,
    private geminiService: GeminiService
  ) {
    this.goals$ = goalsService.goals$;
   }

  async ngOnInit() {
    const userId = localStorage.getItem('userId');
    console.log("User id: ", userId);
    
    await this.goalsService.getGoals(userId!);
    this.loading = false;
  }

  focusOnDiv() {
    this.desc.nativeElement.focus();
  }
 
  presentDeleteGoalDialog(goal: Goal) {
    this.alertController.create({
      header: 'Delete Goal',
      message: `Are you sure you want to delete ${goal.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.deleteGoal(goal);
          }
        }
      ]
    }).then((alert) => {
      alert.present();
    });
  }


 

  addGoal(goal: Goal) {
    this.goalsService.addGoal(goal);
  }

  editDescription(event:any, goal: Goal) {
    const element = event.target as HTMLDivElement;
    const newText = element.innerText.trim();  // Get the updated text
    this.goalsService.updateGoal({...goal, description: newText});
    this.allowEdit = false;
  }

  
  deleteGoal(goal: Goal) {
    this.goalsService.deleteGoal(goal);
  }

  getColor(progress: number) {
    if (progress < 30) {
      return 'danger';
    } else if (progress < 70) {
      return 'warning';
    } else {
      return 'success';
    }  
  }

  checkGoalProgress(goal: Goal) {
    this.checkingProgress = true;
    this.geminiService.estimateGoalProgress(goal).subscribe(
      {
        next: (res: any) =>  { 
          console.log("AI progress feedback succeeded");
          let percentage = (res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
          console.log("Percentage: ", percentage);
            if (isNaN(Number(percentage))) {
              console.log("Percentage is not a number");
              this.checkingProgress = false;
              
              return;
            }
          percentage = Number(percentage.replace(/\s+/g, '')); 
          console.log(typeof percentage + " Percentage:", percentage);

          goal.progress = percentage;
          console.log("GOAL PROGRESS:", goal.progress);
          this.goalsService.updateGoal(goal);
          this.checkingProgress = false;

        },
        error:(err) => {
          console.error("AI response failed: ", err);
          
        }
      }
    )
  }
  
  goalAdvise(goal: Goal) {
    console.log("Getting AI advise");
    this.generating = true;
    this.selectedGoal = goal;
    this.geminiService.goalAdvise(goal.description, goal.type).subscribe(
      {
        next: (res: any) => {
          console.log("Response from Gemini: ", res);
          this.generating = false;
          this.response = (res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response')
  .replace(/\*+/g, '') // Remove all '*' occurrences

          this.generated = true;
          this.showPopup = true;
          console.log("Response: ", this.response);
          
          // this.aiReportModal.present(); // Show the modal

        },
         error: (err: any) => {
          this.generating = false;
          console.error("AI failed to generate the response: ", err.message);
          
         }
      }
    )
  }
  toggleEdit(goal: Goal) {
    // Toggle edit mode
    this.allowEdit = !this.allowEdit;
  
    // Set the focused goal
    this.focusedGoal = this.allowEdit ? goal : null;
  
    // Focus on the description div if edit mode is enabled
    if (this.allowEdit) {
      setTimeout(() => {
        this.focusOnDiv();
      }, 0);
    }
  }

  // dismissModal() {
  //   this.aiReportModal.dismiss();
  // }

  saveAdvice() {
    const savedAdvice = localStorage.getItem('savedAdvice') || '[]';
    const adviceList = JSON.parse(savedAdvice);
    adviceList.push(this.response);
    localStorage.setItem('savedAdvice', JSON.stringify(adviceList));

    console.log("Advice saved!");
    // this.dismissModal();
    this.showPopup = false;

  }

}
