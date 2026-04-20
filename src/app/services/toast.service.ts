import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastSubject = new Subject<Toast>();
    toast$ = this.toastSubject.asObservable();

    success(message: string, duration = 3000): void {
        this.toastSubject.next({ message, type: 'success', duration });
    }

    error(message: string, duration = 4000): void {
        this.toastSubject.next({ message, type: 'error', duration });
    }

    warning(message: string, duration = 3500): void {
        this.toastSubject.next({ message, type: 'warning', duration });
    }

    info(message: string, duration = 3000): void {
        this.toastSubject.next({ message, type: 'info', duration });
    }
}
