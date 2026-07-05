import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MaterialModule } from '../material.module';
import { MatSidenav, MatDrawer } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';

import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { FooterComponent } from '../footer/footer.component';

import { DashboardService } from '../services/dashboard.service';
import { SearchService } from '../services/search.service';
import { SidenavMenuService } from '../services/sidenav-menu.service';

import { ProfileModel } from '../models/profile.model';
import { OCCUPATIONS, QUALIFICATIONS, SUBCASTES } from '../utilitydata/occupations-data';
import { CITIES, COUNTRIES, STATES } from '../utilitydata/country-state-data';
import { environment } from '../../environments/environment';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

@Component({
  selector: 'app-search-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InfiniteScrollModule,
    MaterialModule,
    HeaderComponent,
    SidenavComponent,
    FooterComponent,
    ImageViewerComponent
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'mr-IN' }],
  templateUrl: './search-profile.component.html',
  styleUrls: ['./search-profile.component.css']
})
export class SearchProfileComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('filterDialog') filterDialog!: TemplateRef<any>;
  // @ViewChild('quickViewDialog') quickViewDialog!: TemplateRef<any>;
  // selectedProfile: any; // profile currently being viewed
  @ViewChild('quickViewDialog', { static: true })
  quickViewDialog!: TemplateRef<any>;
  apiUrl = environment.apiUrl;

  profiles: ProfileModel[] = [];
  savedMatches: ProfileModel[] = [];
  interestedProfiles: ProfileModel[] = [];

  selectedProfile: ProfileModel | null = null;
  selectedPhoto: string | null = null;

  loading = false;
  showFilters = false;
  page = 1;
  pageSize = 6;
  totalResults = 0;
  userGender = '';
  total: number = 0;

  private slideshowInterval: any = null;
  private toggleSubscription!: Subscription;
  isPaused = false;

  searchForm!: FormGroup;

  occupationSearchCtrl = new FormControl('');
  subCasteSearchCtrl = new FormControl('');

  filteredQualifications: string[] = [...QUALIFICATIONS];
  filteredSubCastes: string[] = [...SUBCASTES];
  filteredStates: string[] = [...STATES];
  filteredCities: string[] = [...CITIES];
  filteredCountries: string[] = [...COUNTRIES];

  filteredOccupationGroups$ =
    new BehaviorSubject<{ category: string; values: string[] }[]>([]);

  defaultAvatar = '/images/avatar.png';
  matchPercentCache = new Map<string, number>();

  seeking = ['Male', 'Female'];
  maritalStatusOptions = ['Unmarried', 'Divorcee', 'Widowed', 'Separated'];
  showContact = false;

  constructor(
    private dashboardService: DashboardService,
    private searchService: SearchService,
    public sidenavMenuService: SidenavMenuService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.initSearchForm();
    this.setupFilterListeners();
    this.loadUserData();
    const viewContactUserId = sessionStorage.getItem('viewContactUserId');
    if (viewContactUserId) {
          console.log("ViewContact", viewContactUserId);

      // Patch form with profileId
      this.searchForm.patchValue({
        profileId: viewContactUserId
      });

      // Fetch only that profile
      this.fetchProfiles(true);

      // ✅ CLEAR session value AFTER using it
      // sessionStorage.removeItem('viewContactUserId');

      return; // ⛔ stop normal flow
    }
    this.fetchProfiles(true);
    this.loadSavedMatches();
    this.loadInterestedProfiles();


  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.clearSlideshow();
    this.toggleSubscription?.unsubscribe();
  }

  /* ================= FORM ================= */
  private initSearchForm(): void {
    this.searchForm = this.fb.group({
      profileId: [''],
      seeking: [''],
      ageMin: [null],
      ageMax: [null],
      maritalStatus: [[]],
      subCaste: [[]],
      occupationType: [[]],
      education: [[]],
      heightMin: [null],
      heightMax: [null],
      incomeMin: [null],
      incomeMax: [null],
      manglik: [''],
      diet: [''],
      nativePlace: [''],
      workPlace: ['']
    });
  }

  private loadUserData(): void {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      this.userGender = JSON.parse(userData)?.gender?.toLowerCase() || '';
    }
  }

  private setupFilterListeners(): void {
    this.occupationSearchCtrl.valueChanges
      .pipe(startWith(''), debounceTime(200))
      .subscribe(q => {
        const query = (q ?? '').toLowerCase();
        this.filteredOccupationGroups$.next([
          { category: 'Occupations', values: OCCUPATIONS.filter(o => o.toLowerCase().includes(query)) }
        ]);
      });

    this.subCasteSearchCtrl.valueChanges
      .pipe(startWith(''), debounceTime(200))
      .subscribe(q => {
        const query = (q ?? '').toLowerCase();
        this.filteredSubCastes = SUBCASTES.filter(s => s.toLowerCase().includes(query));
      });
  }

  /* ================= SEARCH ================= */
fetchProfiles(reset = false): void {
  if (this.loading) return;
  this.loading = true;

  if (reset) {
    this.page = 1;
    this.profiles = [];
  }

  this.searchService
    .getProfiles(this.searchForm.value, this.page, this.pageSize)
    .subscribe({
      next: (res) => {
        console.log('Mapped API response:', res);

        // Append profiles (only ONE profile will come)
        if (res.profiles && res.profiles.length) {
          this.profiles.push(...res.profiles);
        }

        // Pagination (still safe)
        this.total = res.total;
        this.page = res.page + 1;
        this.pageSize = res.pageSize;

        // ✅ AUTO OPEN QUICK VIEW (filtered by profileId)
        const viewContactUserId = sessionStorage.getItem('viewContactUserId');

        if (viewContactUserId && this.profiles.length) {
          this.openQuickView(this.profiles[0]); // 👈 guaranteed profile

          // clear so dialog opens only once
          sessionStorage.removeItem('viewContactUserId');
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching profiles', err);
        this.loading = false;
      }
    });
}




  onScroll(): void {
    if (this.profiles.length < this.totalResults) {
      this.page++;
      this.fetchProfiles();
    }
  }

  /* ================= UI HELPERS (CARD) ================= */

getProfileImageSrc(data: any): string {
  // Fallback default avatar
  const defaultAvatar = 'images/avatar.png';

  if (!data?.photoDetails?.profilePicture || data.photoDetails.profilePicture.length === 0) {
    return defaultAvatar;
  }

  // Find profile picture marked as isProfile
  let profileOriginal = '';

  for (const img of data.photoDetails.profilePicture) {
    if (!img) continue; // null check
    if (img.isProfile === true && img.originalUrl) {
      profileOriginal = img.originalUrl;
      break;
    }
  }

  // If no isProfile image, pick the first available originalUrl
  if (!profileOriginal) {
    profileOriginal = data.photoDetails.photoDetails?.profilePicture[0]?.originalUrl || '';
  }

  // Build full URL
  const fullUrl = this.apiUrl + profileOriginal;

  // If fullUrl is empty, return default avatar
  return fullUrl || defaultAvatar;
}

  formatFullName(p: ProfileModel): string {
     // p.personalDetails?.firstName,
     //  p.personalDetails?.middleName,
    return [
      p.personalDetails?.lastName
    ].filter(Boolean).join(' ') || '—';
  }

  isInterestSent(p: ProfileModel): boolean {
    return !!p.hasInterest;
  }

  trackByUserId(_: number, p: ProfileModel): string | number {
    return p.userId ?? p.id;
  }

  onImageError(e: any): void {
    e.target.src = 'images/avatar.png';
  }

  /* ================= ACTIONS ================= */
  saveProfile(p: ProfileModel): void {
    if (!this.savedMatches.find(x => x.userId === p.userId)) {
      this.searchService.saveMatch(p);
      this.loadSavedMatches();
    }
  }

  sendInterest(p: ProfileModel): void {
    if (p.hasInterest) return;
    // this.searchService.sendInterest(p);
    p.hasInterest = true;
    this.loadInterestedProfiles();
  }

  loadSavedMatches(): void {
    this.savedMatches = this.searchService.getSavedMatches() || [];
  }

  loadInterestedProfiles(): void {
   // this.interestedProfiles = this.searchService.getInterestedProfiles() || [];
    this.searchService.getInterestedProfiles().subscribe(res => {
      this.interestedProfiles = res;
    });

  }

  /* ================= QUICK VIEW ================= */
  // openQuickView(profile: ProfileModel): void {
  //   this.selectedProfile = profile;
  //   window.scrollTo({ top: 0, behavior: 'smooth' });
  // }

  /* ================= FILTER DIALOG ================= */
  openFilterDialog(): void {
    this.dialog.open(this.filterDialog, {
      width: '95%',
      maxWidth: '800px',
      maxHeight: '90vh',
      panelClass: 'filter-dialog',
      position: { top: '65px' }, // space from top header
    });
  }

  applyFilters(): void {
    this.fetchProfiles(true);
    this.dialog.closeAll();
  }

  clearAllFilters(): void {
    this.searchForm.reset({
      profileId: '',
      seeking: '',
      ageMin: null,
      ageMax: null,
      maritalStatus: [],
      subCaste: [],
      occupationType: [],
      education: [],
      heightMin: null,
      heightMax: null,
      incomeMin: null,
      incomeMax: null,
      manglik: '',
      diet: '',
      nativePlace: '',
      workPlace: ''
    });
    this.subCasteSearchCtrl.setValue('');
    this.occupationSearchCtrl.setValue('');
    this.page = 0; // next page
    this.pageSize = 6;
    this.fetchProfiles();
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  removeSavedProfile(profile: ProfileModel): void {
    this.savedMatches = this.savedMatches.filter(
      p => p.userId !== profile.userId
    );
  }

  clearSlideshow(): void {
  // stop image auto-rotation if any
  // safe no-op if slideshow not implemented yet
}

hasActiveFilters(): boolean {
  if (!this.searchForm) return false;

  const values = this.searchForm.value;

  return Object.keys(values).some(key => {
    const v = values[key];

    // arrays (multi-select filters)
    if (Array.isArray(v)) {
      return v.length > 0;
    }

    // strings / numbers
    return v !== null && v !== undefined && v !== '';
  });
}


openQuickView(profile: any) {
  console.log('Profile:', profile);
  this.showContact = false; // hide contact by default
  this.dialog.open(this.quickViewDialog, {
    width: '90%',
    maxWidth: '100vw',
    maxHeight: 'auto',
    panelClass: 'quick-view-dialog-panel',
    backdropClass: 'quick-view-backdrop',
    position: { top: '4.7%' }, // space from top header
    data: profile
  });
}

  closeQuickView() {
    this.dialog.closeAll(); // close the dialog
  }

// View contact
viewContact(profile: any) {
  console.log("View Contact", profile);
  // Check if user can view contact
  if (!this.canViewContact(profile)) {
    alert('You need to send interest or upgrade membership to view contact.');
    return;
  }

  this.showContact = true;
  // Mark contact as visible
  profile.contactVisible = true;
}

// Example check function
canViewContact(profile: any): boolean {
  return true;
  // Example logic: only premium users or after sending interest
  // Replace this with your actual rules
  const isPremiumUser = profile.plan !== 'free'; // assuming you track current user plan
  const hasInterest = profile.hasInterest;
  return isPremiumUser || hasInterest;
}


formatHeight(height: number | any, unit: string | undefined): string {
  if (!height) return '—';
  unit = unit || 'ft'; // default to feet
  // Fix for incorrectly entered height (like 50)
  if (height > 10) {
    const feet = Math.floor(height / 12);
    const inches = height % 12;
    return `${feet}.${inches} ${unit}`;
  }
  return `${height} ${unit}`;
}

toggleInterest(profile: any): void {
  if (!profile || profile.isLoading) return;

  profile.isLoading = true;

  // ===============================
  // 1️⃣ If Already Accepted → Do Nothing
  // ===============================
  if (profile.interestStatus === 'accepted') {
    profile.isLoading = false;
    return;
  }

  // ===============================
  // 2️⃣ If Pending → Cancel Interest
  // ===============================
  if (profile.interestStatus === 'pending') {

    if (!profile.interestId) {
      console.error('Missing interestId for cancellation');
      profile.isLoading = false;
      return;
    }

    this.searchService.withdrawInterest(profile.interestId)
      .subscribe({
        next: (success: boolean) => {
          if (success) {
            profile.interestStatus = 'cancelled';
            profile.interestId = null;
          }
          profile.isLoading = false;
        },
        error: () => {
          profile.isLoading = false;
        }
      });

    return;
  }

  // ===============================
  // 3️⃣ Otherwise → Send Interest
  // ===============================
  this.searchService.sendInterest(profile.userId)
    .subscribe({
      next: (res: any) => {
        profile.interestStatus = 'pending';
        profile.interestId = res?.interestId || null;
        profile.isLoading = false;
      },
      error: () => {
        profile.isLoading = false;
      }
    });
}


  viewerOpen = false;
  selectedImages: any[] = [];

  openViewer(images?: any[]) {
    this.selectedImages = images || []; // fallback to empty array
    this.viewerOpen = true;
  }

}
