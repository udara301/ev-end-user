import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WalletBalance {
    balance: number;
}

export interface TopupRequest {
    amount: number;
}

export interface TopupResponse {
    order_id: string;
    merchant_id: string;
    hash: string;
    amount: number;
    currency: string;
}

export interface WalletTransaction {
    id: number;
    type: string;
    amount: number;
    status: string;
    reference_id: string;
    description: string;
    created_at: string;
}

declare var payhere: any;

@Injectable({ providedIn: 'root' })
export class WalletService {
    private base = `${environment.apiUrl}/wallet`;

    constructor(private http: HttpClient) {}

    getBalance(): Observable<WalletBalance> {
        return this.http.get<WalletBalance>(`${this.base}/balance`);
    }

    initiateTopup(amount: number): Observable<TopupResponse> {
        return this.http.post<TopupResponse>(`${this.base}/topup`, { amount });
    }

    getTransactions(): Observable<WalletTransaction[]> {
        return this.http.get<WalletTransaction[]>(`${this.base}/transactions`);
    }

    startTopupPayment(
        topupData: TopupResponse,
        user: {
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
            sandbox: true,
            merchant_id: topupData.merchant_id,
            return_url: `${environment.apiUrl}/wallet/topup/return`,
            cancel_url: `${environment.apiUrl}/wallet/topup/cancel`,
            notify_url: `${environment.apiUrl}/wallet/topup/notify`,
            order_id: topupData.order_id,
            items: 'Wallet Top-up',
            amount: Number(topupData.amount).toFixed(2),
            currency: topupData.currency,
            hash: topupData.hash,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone || '0771234567',
            address: user.address,
            city: user.city,
            country: user.country,
        };

        console.log('Starting PayHere payment with data:', payment);
        payhere.startPayment(payment);
    }
}
