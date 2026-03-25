import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class PublicChargersService {
    private base = `${environment.apiUrl}/public-chargers`;

    constructor(private http: HttpClient) { }
    getPublicChargers(): Observable<any[]> {
        return this.http.get<any[]>(this.base);
    }
}