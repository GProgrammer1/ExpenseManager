import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { environment } from 'src/environments/environment';


export const loginResolver: ResolveFn<boolean> = (route, state) => {
  console.log("Login Resolver");
  
  const config = environment.firebaseConfig;
  const app = initializeApp(config);
  const router = inject(Router);
  const auth = getAuth(app);
  const promise : Promise<boolean> = new Promise((resolve,reject) => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      router.navigate(['/tabs']);
      resolve(true);
    }
      else {
        resolve(false);
      }
    });
   
  return promise;
};
