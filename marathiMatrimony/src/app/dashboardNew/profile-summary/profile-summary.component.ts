import { Component, OnInit } from '@angular/core';
import { DashboardDataService } from '../service/dashboard-data.service';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AgeCalPipe } from '../../pipes/age-cal.pipe';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

// ----------------- Interfaces -----------------
interface ProfilePicture {
  filename: string;
  originalUrl: string;
  thumbUrl: string;
  uploadedAt: string;
  isProfile?: boolean;
}

interface PersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface FamilyDetails {
  nativeDistrict: string;
}

interface CareerDetails {
  occupation: string;
}

interface PhotoDetails {
  profilePicture: ProfilePicture[];
}

interface User {
  personalDetails: PersonalDetails;
  familyDetails: FamilyDetails;
  careerDetails: CareerDetails;
  photoDetails: PhotoDetails;
  profileCompletion?: number;
}

@Component({
  selector: 'app-profile-summary',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatCardModule, MatProgressBarModule, AgeCalPipe, RouterModule],
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.css']
})
export class ProfileSummaryComponent implements OnInit {
  user$!: Observable<User>;
  apiUrl: string = environment.apiUrl;
  userData: User | null = null;

  constructor(private dataService: DashboardDataService, private router: Router) {}

  ngOnInit() {
    this.user$ = this.dataService.getUserProfile();

    // Load user data from session storage if available
    const storedUser = sessionStorage.getItem('userData');
    if (storedUser) {
      this.userData = JSON.parse(storedUser);
      console.log('UserData =', this.userData);
    }
  }

  goToProfile() {
    this.router.navigate(['/user-profile']);
  }

  goToUpgrade() {
    this.router.navigate(['/upgrade-userplans']);
  }

  // Get profile thumbnail safely
  getProfileThumb(user: User): string {
    if (!user?.photoDetails?.profilePicture?.length) return 'images/avatar.png';

    const profileImg = user.photoDetails.profilePicture.find(
      (img: ProfilePicture) => img.isProfile
    );

    return profileImg?.thumbUrl || 'images/avatar.png';
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'images/avatar.png';
  }
}
