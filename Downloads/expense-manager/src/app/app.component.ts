import { Component } from '@angular/core';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, chevronBackOutline, chevronDown, chevronForwardOutline, chevronUp, logOutOutline, trash, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, AngularFireAuthModule ],
})
export class AppComponent  {

  constructor() {  
    addIcons({
      chevronBackOutline, chevronForwardOutline, trash, warningOutline, add,logOutOutline, chevronDown, chevronUp
    });
  }  
  
}
