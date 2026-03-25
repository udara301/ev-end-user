import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface SignupPayload {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private tokenKey = 'ev_token';
    constructor(private http: HttpClient) { }


    signup(body: SignupPayload) {
        return this.http.post(`${environment.apiUrl}/auth/customer-signup`, body);
    }


    login(body: LoginPayload) {
        return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login/customer`, body);
    }


    setToken(token: string, isLocalStorage?: boolean) {
        if (isLocalStorage) {
            localStorage.setItem(this.tokenKey, token);
        } else {
            sessionStorage.setItem(this.tokenKey, token);
        }
    }


    getToken(): string | null {
        return localStorage.getItem(this.tokenKey) ? localStorage.getItem(this.tokenKey) : sessionStorage.getItem(this.tokenKey);
    }


    logout() {
        localStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.tokenKey);
    }


    getUserFromToken() {
        const token = this.getToken();
        if (!token) return null;
        return jwtDecode<any>(token);
    }


    isLoggedIn() {
        return !!this.getToken();
    }
}