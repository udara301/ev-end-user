import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface BookingSuccessData {
  orderId: string;
  vehicleName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  totalCost: number;
}

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-success.component.html',
  styleUrl: './booking-success.component.scss'
})
export class BookingSuccessComponent implements OnInit {
  private readonly router = inject(Router);

  successData: BookingSuccessData | null = null;

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation() ?? history.state;
    const state = nav?.extras?.state ?? nav;

    if (state?.orderId) {
      this.successData = {
        orderId: state.orderId,
        vehicleName: state.vehicleName || '',
        pickupLocation: state.pickupLocation || '',
        dropoffLocation: state.dropoffLocation || '',
        pickupDate: state.pickupDate || '',
        dropoffDate: state.dropoffDate || '',
        totalCost: state.totalCost || 0,
      };
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
