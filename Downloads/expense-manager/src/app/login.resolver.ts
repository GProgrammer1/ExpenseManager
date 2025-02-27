import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { uid } from 'chart.js/dist/helpers/helpers.core';
import { app } from 'firebase.config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const loginResolver: ResolveFn<boolean> = (route, state) => {
  return false;
  // const router = inject(Router);
  // const auth = getAuth(app);
  // const promise : Promise<boolean> = new Promise((resolve,reject) => {onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       const userId = user.uid;
  //       // If a user is logged in, navigate to the home page immediately
  //       localStorage.setItem('userId', userId);
  //       router.navigate(['/tabs']);
  //       resolve(true);
  //     }
  //     else {
  //       resolve(false);
  //     }
  //   },
  //   (error) => {
  //     console.error('Error during auth state change', error);
  //     reject(false);
  //   }
  // );
  // });
  // return promise;
};
