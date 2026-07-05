import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { catchError, of } from 'rxjs';

// ✅ Functional Resolver for fetching user profile data
export const usersProfileResolver: ResolveFn<any> = (route, state) => {
  const profileService = inject(ProfileService);

  return profileService.getUserProfile().pipe(
    // Handle API errors gracefully
    catchError((error) => {
      console.error('❌ Error loading user profile:', error);
      // Return a safe fallback value instead of breaking navigation
      return of({ error: true, message: 'Failed to load user profile' });
    })
  );
};
