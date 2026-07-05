// src/app/services/verification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'

export interface VerificationDocument {
  id: string;
  user_id: string;
  doc_type: string;
  doc_url: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  submitted_at: string;
  verified_at?: string | null;
  verified_by?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Upload a new document
  uploadDocument(userId: string, docType: string, file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('user_id', userId);

    const req = new HttpRequest('POST', `${this.apiUrl}/api/verifications/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  // Fetch all user documents
  getUserDocuments(userId: string): Observable<VerificationDocument[]> {
    return this.http.get<VerificationDocument[]>(`${this.apiUrl}/api/verifications/user/${userId}`);
  }

  // Admin: fetch all pending verifications
  getPendingDocuments(): Observable<VerificationDocument[]> {
    return this.http.get<VerificationDocument[]>(`${this.apiUrl}/api/verifications/pending`);
  }

  // Admin: approve document
  approveDocument(docId: string, adminId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${docId}/api/verifications/approve`, { verified_by: adminId });
  }

  // Admin: reject document
  rejectDocument(docId: string, adminId: string, remarks: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${docId}/api/verifications/reject`, { verified_by: adminId, remarks });
  }
}
