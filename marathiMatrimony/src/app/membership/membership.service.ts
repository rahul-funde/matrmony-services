import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MembershipPlan } from './models/membership-plan.model';

/* =======================
   TYPES
======================= */

export type OfflinePaymentStatus = 'pending' | 'approved' | 'rejected';

export interface MembershipFeature {
  label: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {

  private apiUrl = environment.apiUrl;

  /* =======================
     FEATURES (Single Source)
  ======================= */
  private readonly FEATURES: MembershipFeature[] = [
    { label: 'Unlimited Profile Views', value: 'profileViews' },
    { label: 'Priority Listing', value: 'priorityListing' },
    { label: 'Chat Access', value: 'chatAccess' },
    { label: 'Match Recommendations', value: 'matchRecommendations' },
    { label: 'Video Call Access', value: 'videoCallAccess' },
    { label: 'Verified Profile Badge', value: 'verifiedBadge' },
    { label: 'Advanced Search Filters', value: 'advancedFilters' },
    { label: 'Profile Boost', value: 'profileBoost' },
    { label: 'Incognito Mode', value: 'incognitoMode' },
    { label: 'Dedicated Support Access', value: 'dedicatedSupport' }
  ];

  constructor(private http: HttpClient) {}

  /* =======================
     FEATURE ACCESS
  ======================= */
  getFeatures(): MembershipFeature[] {
    return this.FEATURES;
  }

  /* =======================
     ADMIN – PLAN MANAGEMENT
  ======================= */

  createPlan(plan: MembershipPlan): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/memberships/createPlan`,
      plan
    );
  }

  getPlans(): Observable<MembershipPlan[]> {
    return this.http.get<MembershipPlan[]>(
      `${this.apiUrl}/memberships/getPlans`
    );
  }

  getPlanById(id: string): Observable<MembershipPlan> {
    return this.http.get<MembershipPlan>(
      `${this.apiUrl}/memberships/getPlansById/${id}`
    );
  }

  updatePlan(id: string, plan: Partial<MembershipPlan>): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/memberships/updatePlan/${id}`,
      plan
    );
  }

  deletePlan(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/memberships/deletePlan/${id}`
    );
  }

  /* =======================
     USER – MEMBERSHIP FLOW
  ======================= */

  purchasePlan(payload: {
    userId: string;
    planId: string;
    paymentId?: string;
    amount: number;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/memberships/purchasePlan`,
      payload
    );
  }

  upgradePlan(payload: {
    userId: string;
    currentPlanId: string;
    newPlanId: string;
    amount: number;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/memberships/upgradePlan`,
      payload
    );
  }

  getCurrentPlan(userId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/memberships/userplanStatus/${userId}`
    );
  }

  /* =======================
     PAYMENTS – RAZORPAY
  ======================= */

  createOrder(amount: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/payment/create-order`,
      {
        amount,
        currency: 'INR'
      }
    );
  }

  /* =======================
     OFFLINE QR PAYMENTS
  ======================= */

  submitOfflineQRPayment(formData: FormData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/payment/offlineQRPayment`,
      formData
    );
  }

  getOfflinePayments(status: OfflinePaymentStatus): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/payment/getPendingOfflinePayments?status=${status}`,
      {}
    );
  }

  approveOfflinePayment(paymentId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/payment/approveOfflinePayment/${paymentId}`,
      {}
    );
  }

  rejectOfflinePayment(paymentId: string, reason: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/payment/rejectOfflinePayment/${paymentId}`,
      { reason }
    );
  }
}
