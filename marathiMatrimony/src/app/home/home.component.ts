import { Component, TemplateRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';

import { MaterialModule } from '../material.module';
import { MembershipService } from '../membership/membership.service';
import { SidenavMenuService } from '../services/sidenav-menu.service';

import { HeaderComponent } from "../header/header.component";
import { SidenavComponent } from "../sidenav/sidenav.component";
import { FooterComponent } from "../footer/footer.component";
import { HomeContainerComponent } from "../home-container/home-container.component";
import { UpgradeUserplanComponent } from "../membership/upgrade-userplan/upgrade-userplan.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderComponent,
    SidenavComponent,
    FooterComponent,
    HomeContainerComponent,
    UpgradeUserplanComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

  planActive: boolean | null = null;
  loading = true;

  @ViewChild('paymentPendingDialog') paymentPendingDialog!: TemplateRef<any>;
  private dialogRef!: MatDialogRef<any>;

  currentLang: string = 'English';
  paymentPending = false;
  paymentRejected = false;
  rejectReason = "";
  shouldOpenUpgradeAfterClose = false;
  userId = "";
  payment: any = null;
  copied = false;

  private subscriptions: Subscription[] = [];

  constructor(
    public sidenavMenuService: SidenavMenuService, // public to use in template
    private membershipService: MembershipService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const lang = sessionStorage.getItem('currentLang');
    this.currentLang = lang ? lang : 'English';

    this.checkPlanStatus();
  }

  private checkPlanStatus(): void {
    this.loading = true;

    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const userId = userData?.userId;

    if (!userId) {
      this.planActive = false;
      this.loading = false;
      this.openUpgradePopup();
      return;
    }

    this.membershipService.getCurrentPlan(userId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.planActive = !!(res?.hasPlan && res?.isActive);
          this.userId = res?.userId;
          this.paymentPending = !!res?.paymentPending;
          this.paymentRejected = !!res?.paymentRejected;
          this.rejectReason = res?.payment?.rejectReason || '';
          this.payment = res?.payment || null;

          // Handle pending/rejected
          if (this.paymentPending || this.paymentRejected) {
            this.openPaymentPendingPopup();
          }

          if (!this.planActive && !this.paymentPending && !this.paymentRejected) {
            this.openUpgradePopup();
          }
        },
        error: () => {
          this.planActive = false;
          this.paymentPending = false;
          this.paymentRejected = false;
        }
      });
  }

  private openPaymentPendingPopup(): void {
    if (!this.paymentPendingDialog) return;

    this.dialogRef = this.dialog.open(this.paymentPendingDialog, {
      disableClose: true,
      width: '420px'
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    if (this.shouldOpenUpgradeAfterClose) {
      setTimeout(() => this.openUpgradePopup(), 200);
    }
  }

  private openUpgradePopup(): void {
    this.dialog.open(UpgradeUserplanComponent, {
      disableClose: true,
      panelClass: 'full-width-dialog',
      height: '90vh',
      width: '90vw',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  copyUserId(): void {
    if (!this.userId) return;
    navigator.clipboard.writeText(this.userId).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  copyAndOpenWhatsApp(): void {
    if (!this.userId) return;
    const message = this.currentLang === 'मराठी'
      ? `माझा User ID आहे: ${this.userId}`
      : `My User ID is: ${this.userId}`;
    window.open('https://wa.me/919370220481?text=' + encodeURIComponent(message), '_blank');
  }

  downloadPaymentReceiptPDF(): void {
    // Implementation as before
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

}
