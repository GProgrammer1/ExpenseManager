import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';
import { httpInterceptor } from './app/http.interceptor';
import 'hammerjs';

const firebaseApp = initializeApp(environment.firebaseConfig);
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(BrowserAnimationsModule),
    provideFirebaseApp(() => firebaseApp), // Firebase App
    provideAuth(() => getAuth()), // Auth Service
    provideFirestore(() => getFirestore()), // Firestore
    importProvidersFrom(AngularFireModule),
    // importProvidersFrom(AngularFireModule.initializeApp(firebaseConfig)),
    importProvidersFrom(AngularFireMessagingModule),
    importProvidersFrom(IonicModule.forRoot()),
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideAnimations(),

  ],
});
