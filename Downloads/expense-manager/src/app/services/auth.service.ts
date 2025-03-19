import { Inject, Injectable } from '@angular/core';
import {  User } from 'firebase/auth';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {User as AppUser} from '../models';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userSubject = new BehaviorSubject<AppUser>({} as AppUser);
  user$ = this.userSubject.asObservable();

  constructor(@Inject(HttpClient) private http: HttpClient) {

  }


  signup(email: string, password: string, name:string, fcmToken: string): Observable<User> {
  
    return this.http.post<User>(`${environment.userUrl}/signup`, {email, password, name, fcmToken});
  }

  signin(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${environment.userUrl}/signin`, {email, password});
  
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    console.log("Refresh toke in auth service: ", refreshToken);
    
    if (!refreshToken) {
      return new Observable();
    }
    return this.http.post<any>(`${environment.userUrl}/refreshToken`, {refreshToken});
  }
  signout(uid:string): Observable<void> {
    
    return this.http.post<void>(`${environment.userUrl}/signout`, {uid});
  }

  getUserByuid(uid: string): Observable<AppUser> {
    return this.http.get<AppUser>(`${environment.userUrl}/${uid}`);
  }

  updateUserData(uid: string, data: any): Observable<any> {
    return this.http.put(`${environment.userUrl}/updateUserData/${uid}`, data);
  }
  getCurrentUser() {
    return this.http.get<User>(`${environment.userUrl}/currentUser`);
  }
  
}
