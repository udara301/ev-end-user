import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private base = `${environment.apiUrl}/locations`;
    constructor(private http: HttpClient) { }

    getLocations() {
        return this.http.get(this.base);
    }

}