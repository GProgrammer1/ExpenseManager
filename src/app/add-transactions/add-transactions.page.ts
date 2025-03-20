import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-add-transactions',
  templateUrl: './add-transactions.page.html',
  styleUrls: ['./add-transactions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddTransactionsPage implements OnInit {

  selectedTab = 'expense';

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.selectedTab = event.url.includes('income') ? 'income' : 'expense';
      }
    });
  }

  navigate(route: 'expense' | 'income') {
    this.router.navigate([`/add-transactions/${route}`]);
    this.selectedTab = route;
  }
}
