import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon'; // ✅ Add this import
import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-coupon-management',
  standalone: true,
  templateUrl: './coupon-management.component.html',
  styleUrls: ['./coupon-management.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MaterialModule,
    SidebarComponent,
    TopNavComponent
  ]
})
export class CouponManagementComponent {
  couponForm!: FormGroup;

  coupons = [
    { code: 'SAVE100', discount: 100, expiry: '2025-10-01' },
    { code: 'PLATINUM50', discount: 50, expiry: '2025-09-30' }
  ];

  constructor(private fb: FormBuilder) {
    this.couponForm = this.fb.group({
      code: ['', Validators.required],
      discount: ['', [Validators.required, Validators.min(1)]],
      expiry: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.couponForm.valid) {
      this.coupons.push(this.couponForm.value);
      this.couponForm.reset();
    }
  }

  deleteCoupon(code: string) {
    this.coupons = this.coupons.filter(c => c.code !== code);
  }

  
  isSidenavOpen = false;

  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }
}

