import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { PaymentService } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface Booking {
    booking_id: number;
    model_name: string;
    pickup_date: string;
    pickup_time: string;
    dropoff_date: string;
    dropoff_time: string;
    total_price: number;
    booking_status: string;
    pickup_location?: string;
}

@Component({
    selector: 'app-bookings-tab',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './bookings-tab.component.html'
})
export class BookingsTabComponent implements OnInit {
    bookings: Booking[] = [];
    isLoading = true;
    activeFilter: 'all' | 'active' | 'confirmed' | 'pending' | 'completed' = 'all';
    payingBookingId: number | null = null;
    paymentError = '';

    constructor(
        private bookingService: BookingService,
        private paymentService: PaymentService,
        private authService: AuthService,
        private router: Router,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.loadBookings();
    }

    private loadBookings(): void {
        // TODO: Replace with actual user bookings API call
        this.bookingService.getUserBookings().subscribe(
            (data: any) => {
                this.bookings = data || [];
                this.isLoading = false;
            },
            error => {
                console.error('Error fetching bookings:', error);
            }
        );
        this.isLoading = false;
    }

    get filteredBookings(): Booking[] {
        if (this.activeFilter === 'all') return this.bookings;
        return this.bookings.filter(b => b.booking_status.toLowerCase() === this.activeFilter);
    }

    setFilter(filter: 'all' | 'active' | 'confirmed' | 'pending' | 'completed'): void {
        this.activeFilter = filter;
    }

    statusClasses(booking_status: string): string {
        switch (booking_status.toLowerCase()) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'confirmed': return 'bg-emerald-100 text-emerald-700';
            case 'pending': return 'bg-sky-100 text-sky-700';
            case 'completed': return 'bg-slate-100 text-slate-600';
            case 'cancelled': return 'bg-red-100 text-red-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    retryPayment(booking: Booking): void {
        this.paymentError = '';
        this.payingBookingId = booking.booking_id;

        // First check if booking is still pending
        this.bookingService.getBookingById(booking.booking_id).subscribe({
            next: (latest: any) => {
                const status = (latest?.booking_status || '').toLowerCase();
                if (status !== 'pending') {
                    this.payingBookingId = null;
                    this.paymentError = `This booking is no longer pending (status: ${latest.booking_status}). It may have been cancelled.`;
                    this.loadBookings();
                    return;
                }
                this.startRetryPayment(booking);
            },
            error: () => {
                this.payingBookingId = null;
                this.paymentError = 'Unable to verify booking status. Please try again.';
            }
        });
    }

    private startRetryPayment(booking: Booking): void {
        const orderId = String(booking.booking_id);
        const amount = booking.total_price;
        const currency = 'LKR';

        this.paymentService.initiatePayment({
            booking_id: booking.booking_id,
            amount,
            method: 'payhere',
        }).subscribe({
            next: () => {
                this.paymentService.getPaymentHash({ order_id: orderId, amount, currency }).subscribe({
                    next: (hashRes) => {
                        const user = this.authService.getUserFromToken();
                        const fullName = (user?.name || 'Customer').split(' ');
                        const firstName = fullName[0] || 'Customer';
                        const lastName = fullName.slice(1).join(' ') || '-';
                        const amountFormatted = Number(amount).toFixed(2);

                        const payment: any = {
                            sandbox: true,
                            merchant_id: environment.payhereMerchantId,
                            return_url: 'https://travelwithev.com/booking-success',
                            cancel_url: 'https://travelwithev.com/booking-cancel',
                            notify_url: 'https://travelwithev.com/api/v1/payments/notify',
                            order_id: orderId,
                            items: `${booking.model_name} Rental`,
                            amount: amountFormatted,
                            currency,
                            hash: hashRes.hash,
                            first_name: firstName,
                            last_name: lastName,
                            email: user?.email || '',
                            phone: user?.phone || '',
                            address: '-',
                            city: 'Colombo',
                            country: 'Sri Lanka',
                        };

                        this.paymentService.startPayment(payment, {
                            onCompleted: () => {
                                this.ngZone.run(() => {
                                    this.payingBookingId = null;
                                    this.router.navigate(['/booking-success'], {
                                        state: {
                                            orderId,
                                            vehicleName: booking.model_name,
                                            pickupLocation: booking.pickup_location || '',
                                            dropoffLocation: '',
                                            pickupDate: booking.pickup_date,
                                            dropoffDate: booking.dropoff_date,
                                            totalCost: amount,
                                        }
                                    });
                                });
                            },
                            onDismissed: () => {
                                this.ngZone.run(() => {
                                    this.payingBookingId = null;
                                    this.router.navigate(['/booking-cancel'], {
                                        state: {
                                            orderId,
                                            errorMessage: 'Payment was cancelled. Your booking is still pending.',
                                        }
                                    });
                                });
                            },
                            onError: (error: string) => {
                                this.ngZone.run(() => {
                                    this.payingBookingId = null;
                                    this.router.navigate(['/booking-cancel'], {
                                        state: {
                                            orderId,
                                            errorMessage: 'Payment failed: ' + error,
                                        }
                                    });
                                });
                            },
                        });
                    },
                    error: () => {
                        this.payingBookingId = null;
                        this.paymentError = 'Failed to process payment. Please try again.';
                    }
                });
            },
            error: (err) => {
                this.payingBookingId = null;
                this.paymentError = err?.error?.message || 'Failed to initiate payment. Please try again.';
            }
        });
    }
}
