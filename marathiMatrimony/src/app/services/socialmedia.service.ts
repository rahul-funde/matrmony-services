import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Profile {
  userId: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    gender: string;
    maritalStatus?: string;
  };
  email?: string;
  mobilenumber?: string;
  plan?: string;
}

export interface Template {
  id?: string;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialMediaService {
  private apiUrl = `${environment.apiUrl}/socialmedia`;

  constructor(private http: HttpClient) {}

  /* ================= PROFILES ================= */
  // getProfiles(): Observable<{ rows: Profile[] }> {
  //   return this.http.get<{ rows: Profile[] }>(`${environment.apiUrl}/api/admin/userDetails`);
  // }


  getProfiles(payload: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/api/admin/searchProfiles`,
      payload
    );
  }


  /* ================= TEMPLATES ================= */
  getTemplates(): Observable<{ success: boolean; templates: Template[] }> {
    return this.http.get<{ success: boolean; templates: Template[] }>(`${this.apiUrl}/templates`);
  }

  createTemplate(template: Template): Observable<{ success: boolean; template: Template }> {
    return this.http.post<{ success: boolean; template: Template }>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: string, template: Partial<Template>): Observable<{ success: boolean; template: Template }> {
    return this.http.put<{ success: boolean; template: Template }>(`${this.apiUrl}/templates/${id}`, template);
  }

  deleteTemplate(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/templates/${id}`);
  }
}
