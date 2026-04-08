import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';

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

    constructor(
        private bookingService: BookingService,
        private authService: AuthService
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
}
