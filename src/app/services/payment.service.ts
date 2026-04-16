import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentHashRequest {
    order_id: string;
    amount: number;
    currency: string;
}

export interface PaymentHashResponse {
    merchant_id: string;
    hash: string;
}

declare var payhere: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
    private base = `${environment.apiUrl}/payments`;

    constructor(private http: HttpClient) {}

    getPaymentHash(data: PaymentHashRequest): Observable<PaymentHashResponse> {
        return this.http.post<PaymentHashResponse>(`${this.base}/hash`, data);
    }

    initiatePayment(data: { booking_id: number | string; amount: number; method: string }): Observable<{ message: string; paymentId: number }> {
        return this.http.post<{ message: string; paymentId: number }>(`${this.base}/initiate`, data);
    }

    startPayment(
        paymentData: {
            merchant_id: string;
            order_id: string;
            items: string;
            amount: string;
            currency: string;
            hash: string;
            first_name: string;
            last_name: string;
            email: string;
            phone: string;
            address: string;
            city: string;
            country: string;
        },
        callbacks: {
            onCompleted: (orderId: string) => void;
            onDismissed: () => void;
            onError: (error: string) => void;
        }
    ): void {
        payhere.onCompleted = callbacks.onCompleted;
        payhere.onDismissed = callbacks.onDismissed;
        payhere.onError = callbacks.onError;

        const payment = {
            sandbox: !environment.production,
            ...paymentData,
            amount: Number(paymentData.amount).toFixed(2),
            notify_url: `${environment.apiUrl}/payments/notify`,
        };

        payhere.startPayment(payment);
    }
}
