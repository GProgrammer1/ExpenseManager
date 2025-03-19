import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, EnvironmentInjector, inject, NO_ERRORS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, GestureController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);

  @ViewChild('tabsContainer', { static: false }) tabs!: IonTabs;

  tabList = ['transactions', 'stats', 'budget', 'payments', 'goals']; // Ordered list of tabs

  constructor(private gestureCtrl: GestureController) {}

  ngOnInit(): void {
      
  }

}
