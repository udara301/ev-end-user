import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChargerService {
    private base = `${environment.apiUrl}/chargers`;
    private chargesBase = `${environment.apiUrl}/charges`;

    constructor(private http: HttpClient) { }

    search(query: string): Observable<any> {
        const params = new HttpParams().set('ocpp_id', query);
        return this.http.get<any>(`${this.base}/search`, { params });
    }

    startCharging(chargerId: number, connectorId: number, body?: { vehicleId?: string; energy?: number }): Observable<any> {
        return this.http.post<any>(`${this.chargesBase}/agent/${chargerId}/${connectorId}/start`, body || {});
    }

    stopCharging(chargerId: number, connectorId: number): Observable<any> {
        return this.http.post<any>(`${this.chargesBase}/agent/${chargerId}/${connectorId}/stop`, {});
    }

    getActiveSession(): Observable<any> {
        return this.http.get<any>(`${this.chargesBase}/active-session`);
    }
}
