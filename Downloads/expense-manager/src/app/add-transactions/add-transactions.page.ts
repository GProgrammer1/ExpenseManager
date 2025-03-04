import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-add-transactions',
  templateUrl: './add-transactions.page.html',
  styleUrls: ['./add-transactions.page.scss'],
  standalone: true,
  imports: [IonicModule,  CommonModule, FormsModule]
})
export class AddTransactionsPage implements OnInit {

  selectedTab = 'expense';
  constructor(private router: Router) { }

  ngOnInit() {
    console.log("Selected tab is: ", this.selectedTab);
    
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          console.log('Navigated to:', event.url);
          this.selectedTab = event.url.includes('income') ? 'income' : 'expense';
        }
       
      });
   
  }

  navigate(route: 'expense' | 'income') {
    console.log('Navigating to:', route);
    
    this.router.navigate([`/add-transactions/${route}`]);
    this.selectedTab = route;
    console.log('Selected tab is:', this.selectedTab);
    

  }

}
