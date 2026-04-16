import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class BookingService {
    private base = `${environment.apiUrl}/bookings`;
    constructor(private http: HttpClient) { }

    searchAvailableVehicles(category: string, pickupDate: string, dropoffDate: string): Observable<any[]> {
        let params = new HttpParams()
            .set('pickup_date', pickupDate)
            .set('dropoff_date', dropoffDate);

        // Only add category if valid (same logic as backend)
        if (category && category !== 'all') {
            params = params.set('category', category);
        }

        return this.http.get<any[]>(`${this.base}/search`, { params });
    }

    placeBooking(vehicleId: number, pickupDate: string, pickupTime: string, dropoffDate: string, dropoffTime: string, totalPrice: number): Observable<any> {
        const body = {
            vehicle_id: vehicleId,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            dropoff_date: dropoffDate,
            dropoff_time: dropoffTime,
            total_price: totalPrice 
        };
        return this.http.post(`${this.base}/place`, body);
    }

    getUserBookings(): Observable<any[]> {
        return this.http.get<any[]>(`${this.base}/my-bookings`);
    }

    getBookingById(bookingId: number): Observable<any> {
        return this.http.get<any>(`${this.base}/${bookingId}`);
    }
}