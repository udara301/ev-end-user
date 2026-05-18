import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
    private socket$?: WebSocketSubject<any>;
    private messages$ = new Subject<any>();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempts = 0;
    private manuallyDisconnected = false;
    private readonly maxReconnectDelayMs = 10000;

    constructor(private authService: AuthService) {}

    connect(): Observable<any> {
        this.manuallyDisconnected = false;
        if (!this.socket$ || this.socket$.closed) {
            this.openSocket();
        }
        return this.messages$.asObservable();
    }

    private openSocket(): void {
        const token = this.authService.getToken();
        if (!token) {
            console.error('No token available for WebSocket connection');
            return;
        }

        const wsUrlWithToken = `${environment.wsUrl}?token=${encodeURIComponent(token)}`;
        this.socket$ = webSocket(wsUrlWithToken);
        this.socket$.subscribe({
            next: (message) => {
                this.reconnectAttempts = 0;
                this.messages$.next(message);
            },
            error: (error) => {
                console.error('WebSocket error:', error);
                this.scheduleReconnect();
            },
            complete: () => {
                console.log('WebSocket connection closed');
                this.scheduleReconnect();
            }
        });
    }

    private scheduleReconnect(): void {
        if (this.manuallyDisconnected) return;
        if (this.reconnectTimer) return;

        this.reconnectAttempts += 1;
        const delay = Math.min(1000 * this.reconnectAttempts, this.maxReconnectDelayMs);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.manuallyDisconnected) return;
            this.openSocket();
        }, delay);
    }

    sendMessage(message: any) {
        if (this.socket$) {
            this.socket$.next(message);
        }
    }

    disconnect() {
        this.manuallyDisconnected = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket$) {
            this.socket$.complete();
            this.socket$ = undefined;
        }
    }
}
