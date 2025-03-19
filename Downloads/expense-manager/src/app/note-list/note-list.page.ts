import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Note } from '../models';
import { Timestamp } from 'firebase/firestore';
import { NoteService } from '../services/note.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.page.html',
  styleUrls: ['./note-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NoteListPage implements OnInit {

  constructor(private noteService: NoteService, private router: Router, private sanitizer: DomSanitizer,
     private alertCtrl: AlertController
  ) { }

  notesSubject = new BehaviorSubject<Note[]>([]);
  notes$ = this.notesSubject.asObservable();

  noData = false;
  loading = true;
  notes: Note[] = [
    
  ];

  ngOnInit() {
    const userId = localStorage.getItem('userId');
    this.noteService.getNotes(userId!).subscribe((notes: any) => {
      this.notesSubject.next(notes);
      this.loading = false;
      
    });
    
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  openNoteDetail(noteId: string) {
    console.log('Note ID:', noteId);
    
    this.router.navigate([`/note/${noteId}`]);
  }



  formatDate(dateObj: Timestamp) {
    const date = new Date(dateObj.seconds * 1000);    
    const day = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}

  groupNotesByDate(notes: Note[]) {
    const groupedNotes = notes.reduce((acc, note) => {
      const formattedDate = this.formatDate(note.date);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [note]
      } else {
        acc[formattedDate].push(note);
      }
      return acc
    }, {} as {[key:string] : Note[]});
    if (Object.keys(groupedNotes).length === 0) {
      this.noData = true;
    }
    else {
      this.noData = false;
    }
    return groupedNotes;
  }

  addNote() {
    const note: Note = {
      title: 'New Note',
      content: 'Enter your note content here',
      id: '',
      date: Timestamp.fromDate(new Date()),
      userId: localStorage.getItem('userId')!,
    }

    this.noteService.saveNote(note).subscribe({
      next: (res: any) => {
        console.log("Note saved:", res.note);
        
        
        this.router.navigate([`/note/${res.note.id}`]);
        this.notesSubject.next([...this.notesSubject.value, res.note]);
      }, error: (error) => {
        console.error('Error saving note:', error);
      }
    });
  }

  async presentDeleteDialog(note: Note) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Delete cancelled');
          }
        },
        {
          text: 'Delete',
          handler: () => {
            this.deleteNote(note.id);
          }
        }
      ]
    });
    await alert.present();

  }

  deleteNote(id: string) {
    this.noteService.deleteNote(id).subscribe({
      next: (res: any) => {
        console.log("Note deleted:", res);
        this.notesSubject.next(this.notesSubject.value.filter(note => note.id !== id));
      }, error: (error) => {
        console.error('Error deleting note:', error);
      }
    });
  }
}
