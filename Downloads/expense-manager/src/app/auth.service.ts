import { Injectable } from '@angular/core';
import { Auth, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import {app, firestore} from '../../firebase.config';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;

  constructor() {
    // Initialize Firebase Authentication using the firebaseConfig
    this.auth = getAuth(app); // Get Firebase Auth instance

  }

  // Register user with email and password
  async signup(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('User signed up:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error during sign-up:', error);
      throw error;
    }
  }

  // Sign in user with email and password
  async signin(email: string, password: string): Promise<any> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('User signed in:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error during sign-in:', error);
      throw error;
    }
  }

  // Sign out the current user
  async signout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Error during sign-out:', error);
      throw error;
    }
  }

  async updateUserData(uid: string, data: any): Promise<void> {

    try {
      console.log('Updating user data:', data);
      console.log('User ID:', uid);
      
      
      const usersCollection = collection(firestore, 'users');
      const userQuery = query(usersCollection, where('uid', '==', uid));
      const userSnapshot = await getDocs(userQuery);

      const batch = writeBatch(firestore);
      for(const doc of userSnapshot.docs) {
        let userData : import('./models').User = doc.data() as import('./models').User 
        userData = {...userData, ...data};
        console.log('Updating user data:', userData);
        
        batch.update(doc.ref, {...userData});
      }

      await batch.commit();
    } catch (ex: any) {
      console.log("Error adding data to user:", ex.message);
      Promise.reject(ex);
    }
  }


  // Get current user
  getCurrentUser(): any {
    return this.auth.currentUser;
  }

  
}
