import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [

  // ✅ Dynamic routes — disable prerender
  { path: 'user-profile-update/:id', renderMode: RenderMode.Client },
  { path: 'admin-edit-user/:id', renderMode: RenderMode.Client },
  { path: 'plan-edit/:id', renderMode: RenderMode.Client },
  { path: 'welcome/:id',  renderMode: RenderMode.Client },

  // ✅ Pages that fail SSR — disable prerender
  { path: 'search-profile', renderMode: RenderMode.Client },
  { path: 'coupon-management', renderMode: RenderMode.Client },
  { path: 'about-us', renderMode: RenderMode.Client },
  { path: 'doc-verify', renderMode: RenderMode.Client },
  { path: 'timeline', renderMode: RenderMode.Client },
  { path: 'profilesetup', renderMode: RenderMode.Client },
  { path: 'verify-otp', renderMode: RenderMode.Client },
  { path: 'blue-dashboard', renderMode: RenderMode.Client },
  { path: 'dashboard-new/main', renderMode: RenderMode.Client },
  { path: 'interests', renderMode: RenderMode.Client },
  { path: 'subscription-list', renderMode: RenderMode.Client },
  { path: 'membership', renderMode: RenderMode.Client },
  { path: 'plan-list', renderMode: RenderMode.Client },
  { path: 'search-matches', renderMode: RenderMode.Client },
  ///{ path: 'search-profile', renderMode: RenderMode.Client },
  { path: 'carousel', renderMode: RenderMode.Client },
  { path: 'create-package', renderMode: RenderMode.Client },
  { path: 'create-plan', renderMode: RenderMode.Client },
  { path: 'plan-list', renderMode: RenderMode.Client },
  { path: 'user-plans', renderMode: RenderMode.Client },
  { path: 'upgrade-userplans', renderMode: RenderMode.Client },
  { path: 'admin-subscriptions', renderMode: RenderMode.Client },
  // { path: 'welcome', renderMode: RenderMode.Client },

  // ⚠️ If "dashboard-new" is a lazy module — disable entire subtree
  { path: 'dashboard-new', renderMode: RenderMode.Client },
 // { path: 'socialmedia',  renderMode: RenderMode.Client },
  { path: 'contact-us',  renderMode: RenderMode.Client },
  { path: 'reports', renderMode: RenderMode.Client },
  // ✅ Catch all — prerender other safe static pages
  { path: '**', renderMode: RenderMode.Client }
];
