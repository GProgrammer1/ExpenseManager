import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, EnvironmentInjector, inject, NO_ERRORS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, GestureController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline, statsChartOutline, walletOutline, cashOutline } from 'ionicons/icons';
import {Swiper} from 'swiper';

import { IonRouterOutlet } from '@ionic/angular/standalone';
import { TransactionsPage } from '../transactions/transactions.page';
import { StatsPage } from '../Stats/stats.page';
import { BudgetPage } from '../budget/budget.page';
import { PaymentPage } from '../Payments/payments.page';
import { GoalsPage } from '../goals/goals.page';
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
  @ViewChild('swiper', { static: false }) swiper?: Swiper;

  onSlideChange(event: any) {
    const swiperInstance = event.swiper as Swiper;
    const activeIndex = swiperInstance.activeIndex;
    // Update active tab based on activeIndex
  }

  goToSlide(index: number) {
    this.swiper?.slideTo(index);
  }
}
