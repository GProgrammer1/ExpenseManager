import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Note } from '../models';
import { NoteService } from '../services/note.service';
import { Timestamp } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  standalone: true,
  imports:[IonicModule, CommonModule, FormsModule]
})
export class NoteComponent  implements OnInit {

  noteId: string = '';
 
  noteSubject = new BehaviorSubject<Note | null>(null);
  note$ = this.noteSubject.asObservable();
  keyboardVisible = false;
  isEditing = false;
  constructor(private activatedRoute: ActivatedRoute, private noteService: NoteService) { }

  ngOnInit() {
    this.noteId = this.activatedRoute.snapshot.paramMap.get('noteId')!;
    
    this.noteService.getNoteById(this.noteId).subscribe((note: any) => {
      this.noteSubject.next(note);
    }
    );

  }

  toggleEdit() {
    this.isEditing = true;
  }

  saveNote(note: Note) {
    console.log("Saving");
    
    this.noteService.updateNoteById(note.id,note).subscribe((note: any) => {
      console.log('Note updated:', note);
      this.isEditing = false;
    });

  }

  formatDate(dateObj: Timestamp) {
    const date = new Date(dateObj.seconds * 1000);    
    const day = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    return `${day} ${month} ${dayOfMonth}, ${year}`;
}

}
