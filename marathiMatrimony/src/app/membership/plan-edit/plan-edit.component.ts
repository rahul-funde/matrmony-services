import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { SidebarComponent } from '../../admin-dashboard/sidebar/sidebar.component';
import { TopNavComponent } from '../../admin-dashboard/top-nav/top-nav.component';
import { MaterialModule } from '../../material.module';
import { MembershipService } from '../membership.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-plan-edit',
  standalone: true,
  templateUrl: './plan-edit.component.html',
  styleUrls: ['./plan-edit.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MaterialModule,
    SidebarComponent,
    TopNavComponent
  ]
})
export class PlanEditComponent implements OnInit {

  @Input() planData: any;
  planForm!: FormGroup;

  featuresList = [
    { label: 'Unlimited Profile Views', value: 'profileViews' },
    { label: 'Priority Listing', value: 'priorityListing' },
    { label: 'Chat Access', value: 'chatAccess' },
    { label: 'Match Recommendations', value: 'matchRecommendations' },
    { label: 'Video Call Access', value: 'videoCallAccess' },
    { label: 'Verified Profile Badge', value: 'verifiedBadge' },
    { label: 'Advanced Search Filters', value: 'advancedFilters' },
    { label: 'Profile Boost', value: 'profileBoost' },
    { label: 'Virtual Gifts', value: 'virtualGifts' },
    { label: 'Incognito Mode', value: 'incognitoMode' },
    { label: 'Photo Privacy Controls', value: 'photoPrivacy' },
    { label: 'Profile Performance Insights', value: 'profileInsights' },
    { label: 'Nearby Matches', value: 'nearbyMatches' },
    { label: 'Dedicated Support Access', value: 'dedicatedSupport' },
    { label: 'Interest Tags', value: 'interestTags' },
    { label: 'Recently Active Tag', value: 'recentlyActiveTag' }
  ];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private membershipService: MembershipService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.planData = this.route.snapshot.data['planData'];

    this.planForm = this.fb.group({
      name: [this.planData?.name || '', Validators.required],
      title: [this.planData?.title || '', Validators.required],
      duration: [this.planData?.duration || '', Validators.required],
      price: [this.planData?.price || '', Validators.required],
      contactLimit: [this.planData?.contactLimit || '', Validators.required],
      priority: [this.planData?.priority || '', Validators.required],
      planstatus: [this.planData?.planstatus || 'Active', Validators.required],
      users: [this.planData?.users || 0, Validators.required],
      features: [this.planData?.features || []]
    });
  }

  toggleFeature(feature: string, checked: boolean) {
    const current = this.planForm.value.features;

    if (checked) {
      this.planForm.patchValue({ features: [...current, feature] });
    } else {
      this.planForm.patchValue({ features: current.filter((f: string) => f !== feature) });
    }
  }

  onSubmit() {
    if (this.planForm.valid) {
      const updatedPlan = this.planForm.value;
      const planId = this.planData?.id || this.route.snapshot.paramMap.get('id');

      this.membershipService.updatePlan(planId!, updatedPlan).subscribe({
        next: () => {
          this.snackBar.open('Plan updated successfully!', 'Close', { duration: 3000 });
          setTimeout(() => this.router.navigate(['/membership']), 1500);
        },
        error: () => {
          this.snackBar.open('Error updating plan', 'Close', { duration: 3000 });
        }
      });
    }
  }

  isSidenavOpen = false;
  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }
}
