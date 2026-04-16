import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-booking-cancel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-cancel.component.html',
  styleUrl: './booking-cancel.component.scss'
})
export class BookingCancelComponent implements OnInit {
  private readonly router = inject(Router);

  errorMessage = '';
  orderId = '';

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation() ?? history.state;
    const state = nav?.extras?.state ?? nav;

    this.errorMessage = state?.errorMessage || 'Your payment was cancelled or could not be completed.';
    this.orderId = state?.orderId || '';
  }

  retryPayment(): void {
    this.router.navigate(['/booking-summary']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
