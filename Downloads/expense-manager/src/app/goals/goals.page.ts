import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, Observable, of, map, BehaviorSubject} from 'rxjs';
import { Goal, Note, User } from '../models';
import { IonicModule } from '@ionic/angular';
import{ AlertController, GestureController, ToastController } from '@ionic/angular';
import { GoalsService } from '../services/goals.service';
import { IonModal } from '@ionic/angular';
import { GeminiService } from '../services/gemini.service';
import { AuthService } from '../services/auth.service';
import { RouterLink } from '@angular/router';
import { NoteService } from '../services/note.service';
import { Timestamp } from 'firebase/firestore';

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
  filter: 'Priority' | 'Deadline' | 'None' = 'None';
  generating: boolean = false;
  showPopup = false;
  generated = false;
  allowEdit = false;
  isEditing= false;
  loading = true;
  focusedGoal: Goal | null = null;
  checkingProgress = false;
  user: User | null = null;
  selectedGoals: any[] = [];
  filterCriteriaSubject = new BehaviorSubject<'Priority' | 'Deadline' | 'None'>('None');
  filterCriteria$: Observable<'Priority' | 'Deadline' | 'None'> = this.filterCriteriaSubject.asObservable();

  @ViewChild('aiReportModal') aiReportModal!: IonModal;
  @ViewChild('desc') desc!: ElementRef;
  @ViewChildren('longPressElement') longPressElements!: QueryList<any>;

  constructor(private alertController: AlertController, private goalsService: GoalsService,
    private geminiService: GeminiService, private authService: AuthService, private toastController: ToastController,
    private cdr: ChangeDetectorRef, private noteService: NoteService, private alertCtrl: AlertController) 
   {
    
    this.goals$ = combineLatest([this.goalsService.goals$, this.filterCriteria$]).pipe(
      map(([goals, filter]) => {
        switch (filter) {
          case 'Priority':
            return goals.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
          case 'Deadline':
            return goals.sort((a: Goal, b: Goal) => new Date(a.deadline.seconds *1000).getTime() - new Date(b.deadline.seconds * 1000).getTime());
          default:
            return goals;
        }
      })
    ); 
  
   }

   changeFilter(event: any) {
    this.filter = event.detail.value;
    this.filterCriteriaSubject.next(this.filter);
  }

   toDate(deadline: {seconds: number, nanoseconds: number}) {
    return this.formatDate(new Date(deadline.seconds * 1000));
   }

   formatDate(dateObj: Date) {
    const day = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}
   getPriorityValue(priority: string): number {
    switch (priority.toLowerCase()) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }

  ngOnInit() {
    this.loading = true;
    const userId = localStorage.getItem('userId');
    this.goalsService.getGoals(userId!).subscribe({
      next: (goals) => {
        this.loading = false;
        this.goalsService.goalSubject.next(goals);
      },
      error: (error) => {
      }
    });
    this.authService.getUserByuid(userId!).subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
      }
    });
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
    this.goalsService.deleteGoal(goal).subscribe({
      next: (res) => {
        this.goalsService.goalSubject.next(this.goalsService.goalSubject.value.filter(g => g.id !== goal.id));
      },
      error: (err) => {
      }
    });
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

  goalAdvise(goal: Goal) {
    this.generating = true;
    this.selectedGoal = goal;
    this.geminiService.goalAdvise(goal.description, goal.type, goal.deadline, this.user).subscribe(
      {
        next: (res: any) => {
          this.generating = false;
          this.response = (res?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response')
            .replace(/\*+/g, '') // Remove all '*' occurrences
          this.generated = true;
          this.showPopup = true;
        },
        error: (err: any) => {
          this.generating = false;
        }
      }
    )
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
          }
        }, {
          text: 'Ok',
          handler: (data) => {
            this.saveNote(data, this.response);
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
        this.presentToast('Note saved successfully', 'success');
      },
      error: (error: any) => {
        this.presentToast('Error saving note. Please try again.', 'danger');
      }
    });
  };

  presentToast(message: string, color: 'success' | 'danger') {
    this.toastController.create({
      message: message,
      color,
      position: 'top',
      duration: 2000
    }).then((toast) => {
      toast.present();
    })
  }

  toggleEdit(goal: Goal) {
    this.allowEdit = !this.allowEdit;
    this.focusedGoal = this.allowEdit ? goal : null;
    if (this.allowEdit) {
      setTimeout(() => {
        this.focusOnDiv();
      }, 0);
    }
  }

  saveAdvice() {
    const savedAdvice = localStorage.getItem('savedAdvice') || '[]';
    const adviceList = JSON.parse(savedAdvice);
    adviceList.push(this.response);
    localStorage.setItem('savedAdvice', JSON.stringify(adviceList));
    this.showPopup = false;
  }
}