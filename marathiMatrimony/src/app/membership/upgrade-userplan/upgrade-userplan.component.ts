import { Component, ViewChild, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { MembershipService } from '../membership.service';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
declare var Razorpay: any;
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';

import { Subscription } from 'rxjs';

import { SidenavService } from '../../services/sidenav.service';
import { HeaderComponent } from "../../header/header.component";
import { SidenavComponent } from "../../sidenav/sidenav.component";
import { FooterComponent } from "../../footer/footer.component";

@Component({
  selector: 'app-upgrade-userplan',
  standalone: true,
  imports: [MaterialModule, CommonModule, RouterModule, HeaderComponent,
    SidenavComponent,
    FooterComponent,
  ],
  templateUrl: './upgrade-userplan.component.html',
  styleUrls: ['./upgrade-userplan.component.css']
})
export class UpgradeUserplanComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('sidenav') sidenav!: MatSidenav;

  private toggleSubscription?: Subscription;

  plans: any[] = [];
  currentPlan: any = {};
  isLoading = true;
  userId = '';

  /** Offline payment */
  uploadedReceipts: { [key: number]: File } = {};
  receiptPreview: { [key: number]: string } = {};
  qrModalVisible: boolean = false;
  selectedPlan: any = null;
  currentPlanPrice = 0;
  currentPlanStatus = '';
  constructor(private sidenavService: SidenavService,
  private membershipService: MembershipService, public  router: Router, private snackBar: MatSnackBar) {}

ngOnInit() {
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  this.userId = userData?.userId || '';

  // 1️⃣ Load All Plans
  this.membershipService.getPlans().subscribe({
    next: (data) => {
      this.plans = data || [];
      this.isLoading = false;
    },
    error: () => {
      this.plans = [];
      this.isLoading = false;
    }
  });

  // 2️⃣ Load Current Plan
  this.membershipService.getCurrentPlan(this.userId).subscribe({
    next: (plan) => {
      this.currentPlan = plan || {};
      this.currentPlanPrice = this.currentPlan?.plan?.price || 0;
      this.currentPlanStatus = this.currentPlan?.plan?.status || "";
      console.log('currentPlanStatus'+ this.currentPlanStatus);
    },
    error: () => {
      this.currentPlan = {};
      this.currentPlanPrice = 0;
      this.currentPlanStatus = "";
    }
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
      currentPlanId: "",   // the existing plan id ✅ required
      newPlanId: plan.id,
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
    formData.append("contactPolicy", JSON.stringify(plan.contactPolicy));

    this.membershipService.submitOfflineQRPayment(formData).subscribe({
      next: () => {
        this.snackBar.open(
          "Payment received. We will verify & upgrade your plan.",
            "Close",
          { 
            duration: 4000, 
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['snackbar-success'] 
          }
        );
        this.closeQRPopup();
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        alert(error?.error?.error)
        this.snackBar.open(
          error?.error?.error || "Error uploading payment receipt.",
          "Close",
          {
            duration: 4000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['snackbar-error-animated']
          }
        );
      }
    });
  }

  // ---------------------------
  // Manage Sidenav Toggle
  // ---------------------------
  ngAfterViewInit(): void {
    this.toggleSubscription = this.sidenavService.toggle$.subscribe(() => {
      if (this.sidenav) {
        this.sidenav.toggle();
      } else {
        console.error("❌ Sidenav reference is undefined!");
      }
    });
  }

  // Manual toggle (if needed)
  onToggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  // ---------------------------
  // Cleanup
  // ---------------------------
  ngOnDestroy(): void {
    this.toggleSubscription?.unsubscribe();
  }

  get isDashboard(): boolean {
    return this.router.url.includes('/dashboard');
  }

  
}
