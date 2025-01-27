import { Component, EnvironmentInjector, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline, statsChartOutline, walletOutline, cashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(private router: Router) {
    // Add the icons for Transactions, Stats, Budgets, and Payments
    addIcons({
      cardOutline,
      statsChartOutline,
      walletOutline,
      cashOutline,
    });
  }

  ngOnInit(): void {}
}
