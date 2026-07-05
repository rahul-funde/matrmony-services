import { Component, OnInit } from '@angular/core';
import { MembershipService } from '../membership.service';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
declare var Razorpay: any;

@Component({
  selector: 'app-user-plans',
  imports: [MaterialModule, CommonModule, RouterModule],
  templateUrl: './user-plans.component.html',
  styleUrl: './user-plans.component.css'
})
export class UserPlansComponent implements OnInit {

  plans: any[] = [];
  currentPlan: any = {};
  isLoading = true;
  userId = '';

  /** Offline payment */
  uploadedReceipts: { [key: number]: File } = {};
  receiptPreview: { [key: number]: string } = {};
  qrModalVisible: boolean = false;
  selectedPlan: any = null;

  constructor(private membershipService: MembershipService, private router: Router) {}

  ngOnInit() {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    this.userId = userData?.userId || 'G0001-1126';

    this.membershipService.getPlans().subscribe({
      next: data => {
        this.plans = data;
        this.isLoading = false;
      }
    });

    this.membershipService.getCurrentPlan(this.userId).subscribe({
      next: plan => this.currentPlan = plan
    });
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
  }

  // Online payment using Razorpay
  purchasePlan(plan: any) {
    this.isLoading = true;

    this.membershipService.createOrder(plan.price).subscribe({
      next: (order: any) => {
        this.isLoading = false;

        const options = {
          key: 'YOUR_RAZORPAY_KEY_ID',
          amount: plan.price * 100,
          currency: 'INR',
          order_id: order.id,
          handler: (response: any) => this.handlePaymentSuccess(response, plan)
        };

        const rzp = new Razorpay(options);
        rzp.open();
      }
    });
  }

  private handlePaymentSuccess(response: any, plan: any) {
    const payload = {
      userId: this.userId,
      newPlanId: plan.id,
      currentPlanId: "",   // the existing plan id ✅ required
      transactionId: response.razorpay_payment_id,
      paymentMode: 'online',
      amount: plan.price
    };

    this.membershipService.upgradePlan(payload).subscribe(() => {
      alert('Plan upgraded successfully!');
      this.currentPlan.plan = plan;
    });
  }

  // ---------------- QR / Offline Payment ----------------

  // Open QR Popup

  openQRPopup(plan: any) {
    const now = new Date();
    const currentPlanEnd = new Date(this.currentPlan?.plan?.endDate);

    // Show confirmation if current plan is active and has remaining contacts
    if (
      this.currentPlan?.hasPlan &&
      this.currentPlan?.isActive &&
      currentPlanEnd > now &&
      this.currentPlan?.contactRemaining > 0
    ) {
      const proceed = confirm(
        `Your current plan still has ${this.currentPlan.contactRemaining} contacts remaining. Do you want to proceed with purchasing a new plan?`
      );
      if (!proceed) return; // user cancelled
    }

    this.selectedPlan = plan;
    this.qrModalVisible = true;
  }

  // Close QR Popup
  closeQRPopup() {
    this.qrModalVisible = false;
    this.selectedPlan = null;
  }

  // Upload receipt screenshot
  onReceiptUpload(event: any, plan: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadedReceipts[plan.id] = file;

    const reader = new FileReader();
    reader.onload = () => this.receiptPreview[plan.id] = reader.result as string;
    reader.readAsDataURL(file);
  }

  // Submit offline payment
  submitOfflinePayment(plan: any) {
    console.log('Plan =' + plan.id);
    const file = this.uploadedReceipts[plan.id];
    if (!file) {
      alert("Please upload a payment receipt!");
      return;
    }

    const formData = new FormData();
    formData.append("userId", this.userId);
    formData.append("planId", plan.id);
    formData.append("amount", plan.price);
    formData.append("paymentMode", "offline-qr");
    formData.append("receipt", file);

    this.membershipService.submitOfflineQRPayment(formData).subscribe({
      next: () => {
        alert("Payment received. We will verify & upgrade your plan.");
        this.closeQRPopup();
        this.router.navigate(['/dashboard']);
      },
      error: () => alert("Error uploading payment receipt.")
    });
  }
}
