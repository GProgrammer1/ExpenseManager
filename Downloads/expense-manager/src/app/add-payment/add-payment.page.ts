import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import {IonicModule} from '@ionic/angular';
import { Payment } from '../models';
import { Timestamp } from 'firebase/firestore';
import { PaymentService } from '../payment.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.page.html',
  styleUrls: ['./add-payment.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, RouterLink]
})
export class AddPaymentPage implements OnInit {

  description: string = '';
  amount: number | null = null;
  selectedDate: string = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().toLocaleLowerCase().split('t')[0];
  tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().toLocaleLowerCase().split('t')[0];
  constructor(private paymentService: PaymentService, private router: Router) { }

  ngOnInit() {
  }

  add() {

    if (!this.amount) {
      alert('Please enter a valid amount');
      return;
    }
    if (isNaN(this.amount!) || this.amount! < 0 || !/^\d+$/.test(this.amount?.toString())) {
      alert('Please enter a valid amount');
      return;
    }

    if (!this.description) {
      alert('Please fill in all fields');
      return;
    }
    
    console.log('Adding payment:', this.description, this.amount, this.selectedDate);
    const userId = localStorage.getItem('userId');
    const payment: Payment = {
      id: '',
      description: this.description,
      amount: this.amount!,
      dueDate: Timestamp.fromDate(new Date(this.selectedDate)),
      userId: userId!

    };

    console.log('Payment:', payment
    );
    this.paymentService.addPayment(payment, userId!);
    this.router.navigate(['/tabs/payments']);

  }
}
