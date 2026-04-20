import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
    private socket$?: WebSocketSubject<any>;
    private messages$ = new Subject<any>();

    constructor(private authService: AuthService) {}

    connect(): Observable<any> {
        if (!this.socket$ || this.socket$.closed) {
            const token = this.authService.getToken();
            if (!token) {
                console.error('No token available for WebSocket connection');
                throw new Error('Authentication token is required for WebSocket connection');
            }

            const wsUrlWithToken = `${environment.wsUrl}?token=${encodeURIComponent(token)}`;
            this.socket$ = webSocket(wsUrlWithToken);
            this.socket$.subscribe(
                (message) => this.messages$.next(message),
                (error) => console.error('WebSocket error:', error),
                () => console.log('WebSocket connection closed')
            );
        }
        return this.messages$.asObservable();
    }

    sendMessage(message: any) {
        if (this.socket$) {
            this.socket$.next(message);
        }
    }

    disconnect() {
        if (this.socket$) {
            this.socket$.complete();
            this.socket$ = undefined;
        }
    }
}
