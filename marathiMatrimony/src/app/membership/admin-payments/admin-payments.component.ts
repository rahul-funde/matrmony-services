import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { MembershipService, OfflinePaymentStatus } from '../membership.service';
import { environment } from '../../../environments/environment';

import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MaterialModule } from '../../material.module';

export const MY_DATE_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SidebarComponent,
    TopNavComponent,
    MaterialModule,
    FormsModule
  ],
  templateUrl: './admin-payments.component.html',
  styleUrls: ['./admin-payments.component.css'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-IN' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ]
})
export class AdminPaymentsComponent implements OnInit, AfterViewInit {

  /* ================= Sidenav ================= */
  isSidenavOpen = false;
  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }

  safeReceiptUrl!: SafeUrl;

  /* ================= Table ================= */
  displayedColumns = [
    'user',
    'plan',
    'amount',
    'receipt',
    'createdAt',
    'status',
    'reason',
    'actions'
  ];

  payments: any[] = [];
  filteredPayments: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  planList: string[] = [];

  loading = false;
  status: 'pending' | 'approved' | 'rejected' = 'pending';

  /* ================= Dialog ================= */
  @ViewChild('receiptDialog') receiptDialog!: TemplateRef<any>;
  dialogRef!: MatDialogRef<any>;

  selectedPayment: any;
  receiptUrl = '';
  isImage = true;

  zoom = 1;
  rotateDeg = 0;

  private apiUrl = environment.apiUrl;

  searchText = '';
  selectedPlan = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  /* ================= Paginator & Sort ================= */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private membershipService: MembershipService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer
  ) {}

  /* ================= Lifecycle ================= */
  ngOnInit(): void {
    const today = new Date();
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.toDate = new Date();
    this.loadPayments('pending');
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.filterPredicate = (data, filter) => {
      const value = filter.trim().toLowerCase();
      return (
        data.userName?.toLowerCase().includes(value) ||
        data.userMobile?.includes(value) ||
        data.userId?.toLowerCase().includes(value)
      );
    };
  }

  /* ================= API ================= */
  loadPayments(status: OfflinePaymentStatus) {
    this.status = status as any;
    this.loading = true;

    this.membershipService.getOfflinePayments(status).subscribe({
      next: (res) => {
        this.payments = res.payments || [];
        this.filteredPayments = [...this.payments];
        this.planList = [...new Set(this.payments.map(p => p.planName))];
        this.dataSource.data = this.filteredPayments;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /* ================= Filters ================= */
  applyFilters() {
    let filtered = [...this.payments];

    if (this.searchText) {
      const txt = this.searchText.toLowerCase();
      filtered = filtered.filter(p =>
        p.userName?.toLowerCase().includes(txt) ||
        p.userMobile?.includes(txt) ||
        p.userEmail?.toLowerCase().includes(txt)
      );
    }

    if (this.selectedPlan) {
      filtered = filtered.filter(p => p.planName === this.selectedPlan);
    }

    if (this.fromDate && this.toDate) {
      const fromTime = new Date(this.fromDate);
      fromTime.setHours(0, 0, 0, 0);
      const toTime = new Date(this.toDate);
      toTime.setHours(23, 59, 59, 999);

      filtered = filtered.filter(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= fromTime && createdAt <= toTime;
      });
    }

    this.filteredPayments = filtered;
    this.dataSource.data = filtered;

    if (this.paginator) {
      this.paginator.firstPage(); // reset to first page
    }
  }

  applySearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value.trim().toLowerCase();
    this.applyFilters();
  }

  clearFilters() {
    this.searchText = '';
    this.selectedPlan = '';
    const today = new Date();
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.toDate = new Date();
    this.applyFilters();
  }

  get uniquePlans(): string[] {
    return Array.from(new Set(this.payments.map(p => p.planName)));
  }

  /* ================= Receipt Dialog ================= */
  openReceiptDialog(payment: any) {
    this.selectedPayment = payment;

    const rawUrl = this.getReceiptUrl(payment.receiptPath);
    this.safeReceiptUrl = this.sanitizer.bypassSecurityTrustUrl(rawUrl);
    this.isImage = /\.(jpg|jpeg|png|webp)$/i.test(rawUrl);

    this.zoom = 1;
    this.rotateDeg = 0;

    this.dialogRef = this.dialog.open(this.receiptDialog, {
      width: '900px',
      maxWidth: '95vw'
    });
  }

  get transformStyle() {
    return `scale(${this.zoom}) rotate(${this.rotateDeg}deg)`;
  }

  zoomIn() { this.zoom += 0.1; }
  zoomOut() { this.zoom = Math.max(0.5, this.zoom - 0.1); }
  rotate() { this.rotateDeg += 90; }

 downloadReceipt() {
  window.open(this.receiptUrl, '_blank');
}



  /* ================= Actions ================= */
  approve(payment: any) {
    this.membershipService.approveOfflinePayment(payment.paymentId).subscribe(() => {
      this.snack.open('Payment Approved', 'Close', { duration: 2000 });
      this.loadPayments(this.status);
    });
  }

  reject(payment: any) {
    const reason = prompt('Enter rejection reason');
    if (!reason) return;
    this.membershipService.rejectOfflinePayment(payment.paymentId, reason).subscribe(() => {
      this.snack.open('Payment Rejected', 'Close', { duration: 2000 });
      this.loadPayments(this.status);
    });
  }

  getReceiptUrl(path: string) {
    return encodeURI(`${this.apiUrl}${path}`);
  }

  formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  tabToStatus(label: string): OfflinePaymentStatus {
    return label.toLowerCase() as OfflinePaymentStatus;
  }
}
