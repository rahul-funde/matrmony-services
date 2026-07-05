import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { adminAuthGuard } from './guards/admin-auth.guard';
import { PlanGuard } from './guards/plan.guard';

import { UpdateUserProfileComponent } from './admin-dashboard/update-user-profile/update-user-profile.component';
import { PlanResolver } from './membership/resolvers/plan.service';
import { UserProfileResolver } from './resolvers/user-profile.resolver'
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';

import { AdminLayoutComponent } from './DashboardAdmin/layout/admin-layout/admin-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent), canActivate: [AuthGuard, PlanGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent }, // standalone component
  { path: 'reset-password', loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'user-profile', loadComponent: () => import('./user-profile/user-profile.component').then(m=> m.UserProfileComponent), canActivate: [AuthGuard] },
  { path: 'login-admin', loadComponent: () => import('./admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'admin-dashboard', loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m=> m.AdminDashboardComponent), canActivate: [adminAuthGuard] },
  { path: 'user-profile-update/:id', loadComponent: () => import('./admin-dashboard/update-user-profile/update-user-profile.component').then(m=> m.UpdateUserProfileComponent), canActivate: [adminAuthGuard] },
  { path: 'search-matches', loadComponent: () => import('./search-matches/search-matches.component').then(m=> m.SearchMatchesComponent) },
  { path: 'search-profile', loadComponent: () => import('./search-profile/search-profile.component').then(m=> m.SearchProfileComponent) },
  { path: 'interests', loadComponent: () => import('./interests/interests.component').then(m=> m.InterestsComponent) },
  { path: 'carousel', loadComponent: () => import('./carousel/carousel.component').then(m=>m.CarouselComponent)},
  { path: 'create-package', loadComponent: () => import('./admin-dashboard/create-package/create-package.component').then(m=>m.CreatePackageComponent)},
  // { path: 'welcome', loadComponent: () => import('./landing-page/landing-page.component').then(m => m.LandingPageComponent)},
  { path: 'membership', loadComponent: () => import('./membership/membership-dashboard/membership-dashboard.component').then(m=>m.MembershipDashboardComponent)},
  { path: 'create-plan', loadComponent: () => import('./membership/plan-create/plan-create.component').then(m=>m.PlanCreateComponent)},
  { path: 'plan-list', loadComponent: () => import('./membership/plan-list/plan-list.component').then(m=>m.PlanListComponent)},
  { path: 'plan-edit/:id', 
    loadComponent: () => import('./membership/plan-create/plan-create.component').then(m=>m.PlanCreateComponent),
    resolve: { planData: PlanResolver }
  },
  { path: 'user-plans', loadComponent: () => import('./membership/user-plans/user-plans.component').then(m=>m.UserPlansComponent)},
  { path: 'upgrade-userplans', loadComponent: () => import('./membership/upgrade-userplan/upgrade-userplan.component').then(m=>m.UpgradeUserplanComponent)},
  { path: 'admin-subscriptions', loadComponent: () => import('./membership/admin-payments/admin-payments.component').then(m=>m.AdminPaymentsComponent)},
  { path: 'subscription-list', loadComponent: () => import('./membership/subscription-list/subscription-list.component').then(m=>m.SubscriptionListComponent)},
  { path: 'coupon-management', loadComponent: () => import('./membership/coupon-management/coupon-management.component').then(m=>m.CouponManagementComponent)},
  {
    path: 'admin-edit-user/:id',
    loadComponent: () =>
      import('./admin-dashboard/edit-user/edit-user.component').then(m => m.EditUserComponent),
    resolve: {
      userData: UserProfileResolver
    }
  },
  { path: 'about-us', loadComponent: () => import('./about-us/about-us.component').then(m=>m.AboutUsComponent)},
  { path: 'doc-verify', loadComponent: () => import('./user-verification/user-verification.component').then(m => m.UserVerificationComponent)},
  { path: 'timeline', loadComponent: () => import('./timeline/timeline.component').then(m => m.TimelineComponent)},
  // { path: '**', redirectTo: '/welcome' }, // fallback for unknown routes
  { path: 'profilesetup', loadComponent: () => import('./profile-setup/profile-setup.component').then(m => m.ProfileSetupComponent)},
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'blue-dashboard', loadComponent: () => import('./dashboard-blue/dashboard.component').then(m => m.DashboardComponent)},
  {
    path: 'dashboard-new',
    loadChildren: () => import('./dashboardNew/dashboard-new.module').then(m => m.DashboardNewModule)
  },
  { path: 'welcome', loadComponent: () => import('./landing-page-new/landing-page-new.component').then(m => m.LandingPageNewComponent)},
  {
    path: 'welcome/:id',
    loadComponent: () =>
      import('./landing-page-new/landing-page-new.component')
        .then(m => m.LandingPageNewComponent)
  },
  { path: 'contact-us', loadComponent: () => import('./contact-us/contact-us.component').then(m => m.ContactUsComponent)},
  { path: 'reports', loadComponent: () => import('./report/report.component').then(m => m.ReportComponent), canActivate: [adminAuthGuard] },
  { path: 'socialmedia', loadComponent: () => import('./socialmedia-share/socialmedia-share.component').then(m => m.SocialmediaShareComponent)},
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
     {
        path: 'dashboard',
        loadChildren: () =>
          import('./DashboardAdmin/features/admin-dashboard-new/admin-dashboard-new.routes')
            .then(m => m.ADMIN_DASHBOARD_NEW_ROUTES)
      }
    ]
  },

  { path: '**', redirectTo: 'welcome' },
 ];
