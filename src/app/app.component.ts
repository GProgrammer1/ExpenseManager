import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { initializeApp } from 'firebase/app';
import { addIcons } from 'ionicons';
import { add, addCircleOutline, barChartOutline, bulb, bulbOutline, calendarClearOutline, calendarOutline, cardOutline, cashOutline, checkmarkCircle, chevronBackOutline, chevronDown, chevronDownOutline, chevronForwardOutline, chevronUp, close, closeCircleOutline, diamond, documentTextOutline, eye, eyeOff, flagOutline, helpCircle, helpCircleOutline, logOutOutline, pencilOutline, personCircleOutline, personOutline, pieChartOutline, remove, removeCircleOutline, removeOutline, settingsOutline, sparkles, statsChartOutline, sync, trash, trophy, trophyOutline, walletOutline, warningOutline } from 'ionicons/icons';
import { environment } from 'src/environments/environment';
import { Auth,  getAuth, onAuthStateChanged} from '@angular/fire/auth';
import {StatusBar} from '@capacitor/status-bar'
import { AuthService } from './services/auth.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent  {

  private auth!: Auth;
  constructor(private authService: AuthService) {  
    addIcons({
      chevronBackOutline, chevronForwardOutline, trash, warningOutline, add,logOutOutline, chevronDown, chevronUp,
      trophyOutline, bulb, pencilOutline, diamond, flagOutline, close, trophy, eye, eyeOff, addCircleOutline, bulbOutline,
      personCircleOutline, removeCircleOutline, sync, calendarOutline, settingsOutline, statsChartOutline, walletOutline, cashOutline,
      cardOutline, chevronDownOutline, calendarClearOutline, barChartOutline, pieChartOutline, personOutline, documentTextOutline,
      helpCircleOutline, checkmarkCircle
    });
    this.initFirebase();

  }  

  isFirebaseReady = false;


  initFirebase() {
   
      this.auth = getAuth();
      // Adjust the delay if needed
      initializeApp(environment.firebaseConfig);

      onAuthStateChanged(this.auth, (user) => {
        if (user){
          localStorage.setItem('userId', user.uid);
        }
      });
      
      this.isFirebaseReady = true;
      const setStatusBarTransparent = async () => {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setBackgroundColor({ color: '#00000000' }); // Transparent color
      };
      
      setStatusBarTransparent();
   
  }

}
