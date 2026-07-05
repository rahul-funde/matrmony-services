// src/app/services/admin-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminLogin, AdminLoginResponse } from '../models/admin-login';
import { environment } from '../../environments/environment'
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  loginAdmin(data: AdminLogin): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.apiUrl}/api/auth/loginUserAdmin`, data);
  }

  storeToken(token: string): void {
    localStorage.setItem('adminToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  logout(): void {
    localStorage.removeItem('adminToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

