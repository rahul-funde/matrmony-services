import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { MaterialModule } from '../../material.module';
import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { MembershipService, MembershipFeature } from '../membership.service';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  templateUrl: './plan-create.component.html',
  styleUrls: ['./plan-create.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    SidebarComponent,
    TopNavComponent,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ]
})
export class PlanCreateComponent implements OnInit {

  planForm!: FormGroup;
  isSubmitting = false;
  isSidenavOpen = false;

  /** EDIT MODE */
  isEditMode = false;
  planId!: string;

  /** FEATURES (FROM SERVICE) */
  featuresList: MembershipFeature[] = [];
  months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

  constructor(
    private fb: FormBuilder,
    private membershipService: MembershipService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.featuresList = this.membershipService.getFeatures();
    this.buildForm();

    this.planId = this.route.snapshot.paramMap.get('id') || '';
    if (this.planId) {
      this.isEditMode = true;
      this.loadPlan();
    }

    // Reactive updates for auto-calculation
    // this.planForm.valueChanges.subscribe(() => this.updateLimits());
this.planForm.get('totalLimit')?.valueChanges.subscribe(() => this.updateLimits());
this.planForm.get('duration')?.valueChanges.subscribe(() => this.updateLimits());
this.planForm.get('contactLimitType')?.valueChanges.subscribe(() => this.updateLimits());
    // Reactive validators for contact type changes
    this.handleContactTypeChanges();
  }

  private buildForm(): void {
    this.planForm = this.fb.group({
      name: ['', Validators.required],
      duration: [null, [Validators.required, Validators.min(1)]],
      price: [null, [Validators.required, Validators.min(0)]],
      priority: [0, Validators.required],
      users: [0, Validators.required],
      planstatus: ['Active', Validators.required],

      contactLimitType: ['TOTAL', Validators.required],
      totalLimit: [null, Validators.required],
      weeklyLimit: [null],
      monthlyLimit: [null],
      dailyLimit: [null],
      carryForward: [false],

      features: [[]]
    });
  }

  private loadPlan(): void {
    this.membershipService.getPlanById(this.planId).subscribe(plan => {
      this.planForm.patchValue({
        name: plan.name,
        duration: plan.duration,
        price: plan.price,
        priority: plan.priority,
        users: plan.users,
        planstatus: plan.planstatus,

        contactLimitType: plan.contactPolicy.type,
        totalLimit: plan.contactPolicy.totalLimit,
        weeklyLimit: plan.contactPolicy.weeklyLimit,
        monthlyLimit: plan.contactPolicy.monthlyLimit,
        dailyLimit: plan.contactPolicy.dailyLimit,
        carryForward: plan.contactPolicy.carryForward,

        features: plan.features
      });

      /** Disable immutable fields */
      this.planForm.get('name')?.disable();
      this.planForm.get('duration')?.disable();
    });
  }

  private handleContactTypeChanges(): void {
    this.planForm.get('contactLimitType')?.valueChanges.subscribe(type => {
      ['weeklyLimit', 'monthlyLimit'].forEach(field => {
        this.planForm.get(field)?.clearValidators();
        this.planForm.get(field)?.setValue(null);
      });

      if (type === 'WEEKLY') {
        this.planForm.get('weeklyLimit')?.setValidators([Validators.required, Validators.min(1)]);
      }

      if (type === 'MONTHLY') {
        this.planForm.get('monthlyLimit')?.setValidators([Validators.required, Validators.min(1)]);
      }

      ['totalLimit', 'weeklyLimit', 'monthlyLimit'].forEach(field =>
        this.planForm.get(field)?.updateValueAndValidity()
      );
    });
  }

  toggleFeature(feature: string, checked: boolean): void {
    const current = this.planForm.value.features || [];
    this.planForm.patchValue({
      features: checked ? [...current, feature] : current.filter((f: string) => f !== feature)
    });
  }

  isFeatureChecked(feature: string): boolean {
    return this.planForm.value.features?.includes(feature);
  }

  onSubmit(): void {
    if (this.planForm.invalid || this.isSubmitting) {
      this.planForm.markAllAsTouched();
      this.snackBar.open('Please fix validation errors.', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const form = this.planForm.getRawValue();

    const payload = {
      name: form.name,
      duration: Number(form.duration),
      price: Number(form.price),
      priority: Number(form.priority),
      users: Number(form.users),
      planstatus: form.planstatus,
      contactPolicy: {
        type: form.contactLimitType,
        totalLimit: form.totalLimit,
        weeklyLimit: form.weeklyLimit,
        monthlyLimit: form.monthlyLimit,
        dailyLimit: form.dailyLimit,
        carryForward: form.carryForward
      },
      features: form.features,
      updatedAt: new Date().toISOString()
    };

    const request$ = this.isEditMode
      ? this.membershipService.updatePlan(this.planId, payload)
      : this.membershipService.createPlan({ ...payload, createdAt: new Date().toISOString() } as any);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open(
          this.isEditMode ? 'Plan updated successfully!' : 'Plan created successfully!',
          'Close', { duration: 3000 }
        );
        this.router.navigate(['/membership']);
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('Operation failed. Try again.', 'Close', { duration: 3000 });
      }
    });
  }

  deletePlan(): void {
    if (!this.isEditMode) return;

    const confirmed = confirm('Are you sure you want to permanently delete this plan?');
    if (!confirmed) return;

    this.membershipService.deletePlan(this.planId).subscribe({
      next: () => {
        this.snackBar.open('Plan deleted successfully.', 'Close', { duration: 3000 });
        this.router.navigate(['/membership']);
      },
      error: () => {
        this.snackBar.open('Unable to delete plan.', 'Close', { duration: 3000 });
      }
    });
  }

  hasError(control: string, error: string): boolean {
    const c = this.planForm.get(control);
    return !!(c && c.touched && c.hasError(error));
  }

  onSidenavToggle(opened: boolean): void {
    this.isSidenavOpen = opened;
  }

  /** =================== LIMIT CALCULATION =================== */
  updateLimits(): void {
    const total = Number(this.planForm.get('totalLimit')?.value) || 0;
    const duration = Number(this.planForm.get('duration')?.value) || 1;
    const type = this.planForm.get('contactLimitType')?.value;

    const { daily, weekly, monthly } = this.calculateLimits(total, duration, type);
    this.setLimits(weekly, monthly, daily);
  }

  private calculateLimits(total: number, duration: number, type: string) {
    if (!total || total <= 0 || type === 'UNLIMITED') return { daily: 0, weekly: 0, monthly: 0 };

    let monthly = 0, weekly = 0, daily = 0;

    if (type === 'MONTHLY') {
      monthly = Math.ceil(total / duration);
      weekly = Math.ceil(monthly / 4);
      daily = Math.ceil(monthly / 30);
      if (daily === 0 && weekly > 0) daily = 1;
    } else if (type === 'WEEKLY') {
      const totalWeeks = duration * 4;
      weekly = Math.ceil(total / totalWeeks);
      daily = Math.ceil(weekly / 7);
      if (daily === 0 && weekly > 0) daily = 1;
      monthly = weekly * 4;
    } else if (type === 'TOTAL') {
      monthly = Math.ceil(total / duration);
      weekly = Math.ceil(monthly / 4);
      daily = Math.ceil(monthly / 30);
      if (daily === 0 && weekly > 0) daily = 1;
    }

    return { daily, weekly, monthly };
  }

  private setLimits(weekly: number, monthly: number, daily: number): void {
    this.planForm.patchValue(
      { weeklyLimit: weekly, monthlyLimit: monthly, dailyLimit: daily },
      { emitEvent: false }
    );
  }
}
