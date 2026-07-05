import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile';
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AdminUserDataService { 
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}
  
  getData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/admin/userDetails`);
  }
  
  // Method to get stats data
  getStatsData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/admin/adminStats`);
  }


   // API call to update the user's plan
  updateUserPlan(newPlan: string, doc_id: string, planduration: string, planId: string, prePlanId:string): Observable<any> {
    const payload = {
      plan: newPlan,
      doc_id: doc_id,
      duration: planduration,
      planId: planId,
      prePlanId: prePlanId
    };
    return this.http.put(`${this.apiUrl}/api/admin/updatePlan`, payload);
  }

 // Get all membership plans
  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/memberships/getPlans`);
  }
  updateUserStatus(newStatus: string, doc_id: string): Observable<any> {
    const payload = {
      status: newStatus,
      doc_id: doc_id
    };
    return this.http.put(`${this.apiUrl}/api/admin/updateStatus`, payload);
  }
  getProfileOptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/home/profileUtility`);
  }

  getUserProfile(): Observable<any> {
    return this.http.get<UserProfile>(`${this.apiUrl}/home/getUserProfile`);
  }

  updateUserProfile(profileData: UserProfile): Observable<any> {
    return this.http.put<UserProfile>(`${this.apiUrl}/home/updateProfile`, profileData);
  }

  getUserById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/api/admin/getUserProfile/${id}`);
  }

  DeleteUser(doc_id: string, planId: string): Observable<any> {
    const options = {
      body: { planId }
    };
    return this.http.delete<UserProfile>(
      `${this.apiUrl}/api/admin/DeleteUser/${doc_id}`, options
    );
  }

  updateUserPassword(userId: string, newPassword: string) {
    return this.http.put(
      `${this.apiUrl}/api/admin/updatePasswordByAdmin/${userId}`,
      { newPassword }
    );
  }


}
