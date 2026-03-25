import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';


@Injectable()
export class ApiInterceptor implements HttpInterceptor {
    constructor(private auth: AuthService, private router: Router) { }
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        const token = this.auth.getToken();
        if (token) {
            const cloned = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next.handle(cloned).pipe(
                catchError((err: HttpErrorResponse) => {
                    if (err.status === 401) {
                        // No token or invalid token
                        this.auth.logout();
                        this.router.navigate(['/login']);
                    } else if (err.status === 403) {
                        // Token expired
                        this.auth.logout();
                        this.router.navigate(['/login'], { queryParams: { expired: true } });
                    }
                    return throwError(() => err);
                })
            );
        }
        return next.handle(req);
    }
}