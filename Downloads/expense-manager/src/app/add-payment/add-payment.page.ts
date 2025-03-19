import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Payment } from '../models';
import { Timestamp } from 'firebase/firestore';
import { PaymentService } from '../services/payment.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.page.html',
  styleUrls: ['./add-payment.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class AddPaymentPage implements OnInit {
  
  description: string = '';
  amount: number | null = null;
  selectedDate: string = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString();
  tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString();

  constructor(private paymentService: PaymentService, private router: Router) {}

  ngOnInit() {}

  add() {
    if (!this.amount || isNaN(this.amount) || this.amount < 0 || !/^\d+$/.test(this.amount.toString())) {
      alert('Please enter a valid amount');
      return;
    }

    if (!this.description) {
      alert('Please fill in all fields');
      return;
    }

    const userId = localStorage.getItem('userId');
    const payment: Payment = {
      id: '',
      description: this.description,
      amount: this.amount!,
      dueDate: Timestamp.fromDate(new Date(this.selectedDate)),
      userId: userId!
    };

    this.paymentService.addPayment(payment, userId!).subscribe({
      next: (res) => {
        this.paymentService.paymentSubject.next([...this.paymentService.paymentSubject.value, res.payment]);
        this.router.navigate(['/tabs/payments']);
      },
      error: (err) => {
        console.error('Error adding payment:', err);
      }
    });
  }
}
