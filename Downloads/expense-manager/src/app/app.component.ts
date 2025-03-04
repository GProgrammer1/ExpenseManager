import { Component } from '@angular/core';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { firebaseConfig } from 'firebase.config';
import { initializeApp } from 'firebase/app';
import { addIcons } from 'ionicons';
import { add, addCircleOutline, bulb, bulbOutline, chevronBackOutline, chevronDown, chevronForwardOutline, chevronUp, close, diamond, eye, eyeOff, flagOutline, logOutOutline, pencilOutline, personCircleOutline, remove, removeCircleOutline, removeOutline, sparkles, sync, trash, trophy, trophyOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AngularFireAuthModule ],
})
export class AppComponent  {

  constructor() {  
    addIcons({
      chevronBackOutline, chevronForwardOutline, trash, warningOutline, add,logOutOutline, chevronDown, chevronUp,
      trophyOutline, bulb, pencilOutline, diamond, flagOutline, close, trophy, eye, eyeOff, addCircleOutline, bulbOutline,
      personCircleOutline, removeCircleOutline, sync
    });
    this.initFirebase();
  }  

  isFirebaseReady = false;


  async initFirebase() {
    try {
      initializeApp(firebaseConfig);
      this.isFirebaseReady = true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }
}
