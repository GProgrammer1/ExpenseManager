import { Component, OnInit } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { FirestoreService } from './firestore.service';
import { collection } from 'firebase/firestore';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { add, chevronBackOutline, chevronForwardOutline, trash, warningOutline } from 'ionicons/icons';
import { StatusBar } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AngularFireAuthModule ],
})
export class AppComponent  {

  constructor(private router: Router, private firestoreService: FirestoreService, private http: HttpClient,
    private platform: Platform
  ) {
   
    addIcons({
      chevronBackOutline, chevronForwardOutline, trash, warningOutline, add
    });
    // this.platform.ready().then(() => {
    //   // You can add status bar customization here
    //   StatusBar.hide();
    // });

  }

  user$!: Observable<User | null>;
  async ngOnInit(): Promise<void> {
    
    await this.fetchFCMTokenAndSendNotification();
  }

  async fetchFCMTokenAndSendNotification() {
    this.firestoreService.user$.subscribe((user: User | null) => {
      if (user) {
        (async () => {
          console.log("User in fetchFCMTokenAndSendNotification:", user);
          const uid= user.uid;
          const fullUser = await this.firestoreService.getUserByuid(uid);
          const fcmToken = fullUser[0].fcmToken;

          console.log("FCM Token in fetchFCMTokenAndSendNotification:", fcmToken);
          
          this.http.post('http://192.168.1.111:3000/send-notification', {token: fcmToken}).subscribe((res: any) => {
            console.log("Response from server:", res.message);
          });
        })();
      } else {
        return;
      }
    });
    
  }
}
