import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileModel } from '../models/profile.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SearchFilters {
  location?: string;
  ageMin?: number | null;
  ageMax?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private readonly savedMatchesKey = 'savedMatches';
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============================
  // 🔎 PROFILE SEARCH
  // ============================

  getProfiles(
    filters: SearchFilters = {},
    page: number = 1,
    pageSize: number = 6
  ): Observable<{ profiles: any[]; total: number; page: number; pageSize: number }> {

    const payload = { ...filters, page, pageSize };

console.log("Search API Payload:", payload);
    return this.http
      .post<any>(`${this.apiUrl}/api/home/AdvprofileSearch`, payload)
      .pipe(
        map(res => {
          const profiles = Array.isArray(res?.profiles) ? res.profiles : [];
          const total = typeof res?.totalResults === 'number' ? res.totalResults : 0;
          const currentPage = res?.page ?? 1;
          const currentPageSize = res?.pageSize ?? profiles.length;

          return {
            profiles,
            total,
            page: currentPage,
            pageSize: currentPageSize
          };
        })
      );
  }

  // ============================
  // 💾 SAVED MATCHES (LocalStorage)
  // ============================

  getSavedMatches(): ProfileModel[] {
    return this.loadFromStorage(this.savedMatchesKey);
  }

  saveMatch(profile: ProfileModel): void {
    const saved = this.loadFromStorage(this.savedMatchesKey);

    if (!saved.some(p => p.userId === profile.userId)) {
      saved.push(profile);
      this.saveToStorage(this.savedMatchesKey, saved);
    }
  }

  removeMatch(profile: ProfileModel): void {
    const updated = this
      .loadFromStorage(this.savedMatchesKey)
      .filter(p => p.userId !== profile.userId);

    this.saveToStorage(this.savedMatchesKey, updated);
  }

  clearMatches(): void {
    localStorage.removeItem(this.savedMatchesKey);
  }

  // ============================
  // ❤️ INTEREST SYSTEM (Backend Driven)
  // ============================

  /**
   * ✅ Send Interest
   */
  sendInterest(userId: string): Observable<{ interestId: string; status: string }> {
    return this.http.post<any>(
      `${this.apiUrl}/api/interest/updateInterestStatus`,
      {
        otherUserId: userId,
        newStatus: 'pending'
      }
    );
  }

  /**
 * ✅ Remove Interest (Backward Compatible)
 * Used in older components
 */
removeInterest(interestId: string): Observable<boolean> {
  return this.withdrawInterest(interestId);
}


  /**
   * ✅ Withdraw / Cancel Interest
   */
  withdrawInterest(interestId: string): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/api/interest/updateInterestStatus`, {
        interestId,
        newStatus: 'cancelled'
      })
      .pipe(
        map(() => true),
        catchError((error) => {
          console.error('Error withdrawing interest:', error);
          return of(false);
        })
      );
  }

  // ============================
  // 🔧 Helpers
  // ============================

  private loadFromStorage(key: string): ProfileModel[] {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(key: string, data: ProfileModel[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ============================
// ❤️ Get Interested Profiles (Backend Driven)
// ============================

getInterestedProfiles(): Observable<any[]> {
  return this.http
    .get<any[]>(`${this.apiUrl}/api/interest/mySentInterests`)
    .pipe(
      map((res: any[]) => res || []),
      catchError((error) => {
        console.error('Error fetching interested profiles:', error);
        return of([]);
      })
    );
}

}
