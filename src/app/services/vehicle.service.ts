import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class VehicleService {
	private base = `${environment.apiUrl}/vehicles`;
	constructor(private http: HttpClient) { }

	getVehicles() {
		return this.http.get(this.base);
	}

	getVehicleById(id: string | number) {
		return this.http.get(`${this.base}/${id}`);
	}
}
