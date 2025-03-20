import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Note } from '../models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  constructor(private http: HttpClient) { }

  saveNote(note: Note) {
    return this.http.post<Note>(`${environment.noteUrl}/addNote`, note);
  }

  deleteNote(noteId: string) {
    return this.http.delete(`${environment.noteUrl}/${noteId}`);
  }

  getNotes(userId: string) {
    return this.http.get(`${environment.noteUrl}/all/${userId}`);
  }

  getNoteById(noteId: string) {
    return this.http.get(`${environment.noteUrl}/${noteId}`);
  }

  updateNoteById(noteId: string, note: Note) {
    return this.http.put(`${environment.noteUrl}/${noteId}`, note);
  }
}
