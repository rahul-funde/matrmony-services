import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile';
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private apiUrl = environment.apiUrl;

  constructor(private http:HttpClient) { }

  getUserProfile(): Observable<any> {
    return this.http.get<UserProfile>(`${this.apiUrl}/api/home/getUserProfile`);
  }
  
  updateUserProfile(profileData: UserProfile): Observable<any> {
    return this.http.put<UserProfile>(`${this.apiUrl}/api/home/updateProfile`, profileData);
  }

  getProfileOptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/home/profileUtility`);
  }

  getProfileOptions1(): Observable<any> {
          console.log('API response:');
    return this.http.get<any>(`${this.apiUrl}/api//home/profileUtility`);
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file); // The backend should expect `image` as the field name
    // console.log("image upload"+ `${this.baseUrl}/upload/images`);
    return this.http.post<string>(`${this.apiUrl}/api/upload/images`, formData);
  }

  deleteImage(fileName: string, imgtype: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/delete/delete-image/${fileName}?imgtype=${imgtype}`);
  }

  deleteIdProof(): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/api/delete/delete-id-proof`
    );
  }

  uploadImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file)); // match backend `images` field
    return this.http.post<any>(`${this.apiUrl}/api/upload/images`, formData);
  }
  
  uploadImagesByAdmin(userId: string, files: File[]): Observable<any> {
    const formData = new FormData();

    // send userId
    formData.append('userId', userId);

    // send images
    files.forEach(file => {
      formData.append('images', file); // must match backend field name
    });

    return this.http.post<any>(
      `${this.apiUrl}/api/upload/images`,
      formData
    );
  }
  
  updateUserProfileById(id: string, profileData: UserProfile): Observable<any> {
    return this.http.put<UserProfile>(`${this.apiUrl}/api/admin/updateProfileById/${id}`, profileData);
  }

  uploadIdProof(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/upload/id-proof`, formData);
  }

  getLocationByPincode(pincode: string) {
    return this.http.get<any>(
      `${this.apiUrl}/api/home/pincode/${pincode}`
    );
  }

  saveDraft(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/home/saveDraft`, profileData);
  }
  
}
