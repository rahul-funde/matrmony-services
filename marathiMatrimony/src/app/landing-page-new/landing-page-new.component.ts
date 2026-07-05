import { 
  AfterViewInit, 
  ChangeDetectorRef, 
  Component, 
  OnInit, 
  ViewChild, 
  OnDestroy,
  TemplateRef,
  inject,
  PLATFORM_ID,
  HostListener,
  ElementRef
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormGroupDirective, 
  FormArray,
  FormControl
} from '@angular/forms';

import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { Observable, Subscription, forkJoin, startWith, map, of, Subject } from 'rxjs';


import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { SearchFilters, LandingpageService } from '../services/landingpage.service';
import { OCCUPATIONS, OCCUPATION_GROUPS, educationOptions, SUBCASTES } from '../utilitydata/occupations-data';
import { LoginRequest } from '../models/auth.model';
import { RegisterComponent } from '../register-new/register.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment'
import { isPlatformBrowser } from '@angular/common';
import { AboutUsComponent } from '../about-us/about-us.component';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';
import { ContactUsComponent } from '../contact-us/contact-us.component';
import { PopupBannerComponent } from '../popup-banner/popup-banner.component';

import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';

interface OccupationGroup {
  category: string;
  values: string[];
}

@Component({
  selector: 'app-landing-page-new',
  templateUrl: './landing-page-new.component.html',
  styleUrl: './landing-page-new.component.css',
  standalone: true,
  imports: [
    CarouselModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
    ImageViewerComponent,
    PopupBannerComponent
  ]
})

export class LandingPageNewComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('loginDialog') loginDialog!: TemplateRef<any>;
  @ViewChild('profileDialog') profileDialog!: TemplateRef<any>;

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef<HTMLElement>;

  /** =========================
   * OCCUPATION FILTER (NEW)
   * ========================= */
  occupationSearchCtrl: FormControl = new FormControl('');
  // filteredOccupationGroups$!: Observable<OccupationGroup[]>;

  allOccupationGroups: OccupationGroup[] = OCCUPATION_GROUPS;
  private destroy$ = new Subject<void>();

maritalStatusOptions: string[] = [
    'Unmarried', 'Divorcee', 'Widowed', 'Separated'
  ];

  subCasteOptions: string[] = SUBCASTES;

  educationOptions: string[] = educationOptions;

  occupationOptions: string[] = [
    'Software Engineer', 'Teacher', 'Doctor', 'Electrical Technician', 'Farmer'
  ];
  filtersoccupation = { occupation: '' };
  occupations = OCCUPATIONS;
  filteredOccupations!: Observable<string[]>;
  filteredOccupationGroups$ = new BehaviorSubject<OccupationGroup[]>(this.allOccupationGroups);
  apiUrl = environment.apiUrl;
  primaryOpen = true;
  advancedOpen = false;

  searchForm!: FormGroup;
  loginForm!: FormGroup;

  private loginDialogRef!: MatDialogRef<any>;
  private profileDialogRef!: MatDialogRef<any>; 
  hidePassword = true;
  isLoading = false;

  customOptions: OwlOptions = {
    loop: true,
    margin: 0,
    nav: false,
    dots: true,
    autoplay: true,
    autoplayTimeout: 4500,
    autoplayHoverPause: true,
    responsive: {
      0: { items: 1 },
      600: { items: 1 },
      1000: { items: 1 }
    }
  };

 slides = [
  { id: '1', image: 'images/img1.png', title: 'Slide 1' },
  { id: '2', image: 'images/11.png', title: 'Slide 2' },
  { id: '3', image: 'images/22.png', title: 'Slide 3' },
  { id: '4', image: 'images/33.png', title: 'Slide 4' },
  { id: '5', image: 'images/44.png', title: 'Slide 5' },
  { id: '6', image: 'images/img2.png', title: 'Slide 6' },
  { id: '7', image: 'images/img4.png', title: 'Slide 7' },
  { id: '8', image: 'images/img5.png', title: 'Slide 8' },
];


  genders = ['Man', 'Woman'];
  seeking = ['Male', 'Female'];
  maritialstatus = ['Unmarried girl', 'Unmarried boy', 'Divorcee girl/widow', 'Divorcee boy/widower'];
  occupationtype = ['Govt', 'Private', 'Business'];
  castes = ['96 kuli', 'Maratha', 'Kunbi', 'Deshmukh Maratha', 'Tirale Kunbi'];

  profiles: any[] = [];
  loading = false;
  errorMessage = '';
  noResults = false;
  private platformId = inject(PLATFORM_ID);

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private landpageService: LandingpageService,
    private route: ActivatedRoute, // ✅ added
    private snackBar: MatSnackBar,
    ) {
      // Clear previous session data
      sessionStorage.clear();
      localStorage.clear();
    }

  currentLang: 'मराठी' | 'English' = 'मराठी'; // default Marathi

  ngOnInit(): void {
    //   console.log("step1: Oninit");
    // if (isPlatformBrowser(this.platformId)) {
    //   sessionStorage.clear();
    //   localStorage.clear();
    // }

    const savedLang = sessionStorage.getItem('currentLang');
    this.currentLang = (savedLang === 'मराठी' || savedLang === 'English')
      ? savedLang
      : 'मराठी';

    sessionStorage.setItem('currentLang', this.currentLang);

    // ✅ INIT FORMS FIRST
    this.searchForm = this.fb.group({
      seeking: [''],
      profileId: [''],
      ageMin: ['', null],
      ageMax: ['', null],
      maritalStatus: [[]],    // ✅ array
      subCaste: [[]],         // ✅ array
      occupationType: [[]],   // ✅ array
      education: [[]],        // ✅ array
      heightMin: [''],
      heightMax: [''],
      incomeMin: [''],
      incomeMax: [''],
      manglik: [''],
      diet: [''],
      nativePlace: [''],
      workPlace: ['']
    });


    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required],
    });

    // ✅ Route param logic
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log("step2: Oninit", id);
      if (id) {
        console.log("step3: loadProfileById call", id);
        this.loadProfileById(id);   // public profile view
      }
      this.onSearch();            // normal landing search
      
    });

    // ✅ Query param for login popup
    this.route.queryParams.subscribe(params => {
      if (params['showLogin'] === 'true') {
        setTimeout(() => this.openLoginDialog(), 300);
      }
    });

    this.initOccupationSearch();

     // this.searchForm.valueChanges
     //  .pipe(debounceTime(300), takeUntil(this.destroy$))
     //  .subscribe(() => this.onSearch());

    // 3️⃣ Profile ID override logic (ADD HERE)
      this.searchForm.get('profileId')?.valueChanges.subscribe(id => {
        if (id) {
          this.searchForm.disable({ emitEvent: false });
          this.searchForm.get('profileId')?.enable({ emitEvent: false });
        } else {
          this.searchForm.enable({ emitEvent: false });
        }
      });
}

ngAfterViewInit(): void {

  // this.onSearch();
  this.animateCounter(10000, 1500);
  this.cdr.detectChanges();

  if (!isPlatformBrowser(this.platformId) || !this.scrollContainer) return;

  const el = this.scrollContainer.nativeElement;

  // Start auto scroll
  this.startScroll();

  // Stop auto scroll if user interacts
  el.addEventListener('scroll', () => this.stopAutoScroll(), { passive: true });
  el.addEventListener('wheel', () => this.stopAutoScroll(), { passive: true });
  el.addEventListener('touchstart', () => this.stopAutoScroll(), { passive: true });
  el.addEventListener('mousedown', () => this.stopAutoScroll());

}
  showFilters = false;

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // 🔍 Search Profiles
  onSearch() {

    if (!isPlatformBrowser(this.platformId)) {
      return; // SSR protection
    }

    if (!this.searchForm) {
      return;
    }

    if (!this.searchForm.valid) {
      return;
    }

    if (this.searchForm.valid) {
      const filterData: SearchFilters = this.searchForm.value;
      this.loading = true;
      this.errorMessage = '';
      this.noResults = false;

      this.landpageService.searchProfiles(filterData).subscribe({
        next: (res) => {
          this.loading = false;
          this.profiles = res.profiles || [];
          this.noResults = this.profiles.length === 0;
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = 'Something went wrong. Please try again later.';
          console.error('Search failed:', err);
        }
      });
    } else {
      this.searchForm.markAllAsTouched();
    }
      this.showFilters = false; // auto-close after search (pro UX)
  }

// 🔐 Login with automatic token refresh support
login(): void {

  console.log("Login method triggered");

  if (this.loginForm.invalid) {
    console.log("Form invalid");
    this.loginForm.markAllAsTouched();
    this.snackBar.open(
      'Please fill in all required fields.',
      'Close',
      { duration: 3000 }
    );
    return;
  }

  const loginData: LoginRequest = this.loginForm.value;
  console.log("Login data:", loginData);

  this.isLoading = true;

  this.authService.login(loginData).subscribe({

    next: (res) => {

      console.log("Login API response:", res);

      this.isLoading = false;

      const user = res?.user;
      // ✅ STORE USER DATA HERE
      sessionStorage.setItem('userData', JSON.stringify(user));
      console.log("User stored in sessionStorage:", user);

      const userId = user?.userId;
      const profileCompletion = Number(user?.profileCompletion) || 0;

      console.log("User ID:", userId);
      console.log("Profile Completion:", profileCompletion);

      if (!userId) {
        console.log("User ID missing → logging out");
        this.authService.logout();
        this.snackBar.open(
          'Invalid user data. Please login again.',
          'Close',
          { duration: 4000 }
        );
        return;
      }

      console.log("Access token after login:",
        this.authService.getAccessToken()
      );

      this.snackBar.open(
        'Login successful!',
        'Close',
        { duration: 2000 }
      );

      // ✅ Navigate AFTER token is stored
      setTimeout(() => {

        const targetRoute =
          profileCompletion > 0 ? '/dashboard' : '/user-profile';

        console.log("Attempting navigation to:", targetRoute);
        console.log("Current URL before navigation:", this.router.url);

        this.router.navigate([targetRoute]).then(success => {
          console.log("Navigation success:", success);
          console.log("Current URL after navigation:", this.router.url);
        }).catch(err => {
          console.error("Navigation error:", err);
        });

      }, 0);

      this.close();
    },

    error: (err) => {
      this.isLoading = false;
      console.error('Login failed:', err);

      this.snackBar.open(
        err?.error?.message ||
        'Login failed. Please check your credentials.',
        'Close',
        { duration: 4000 }
      );
    }
  });
}



  login1(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const loginData: LoginRequest = this.loginForm.value;
    this.isLoading = true;

    this.authService.login(loginData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open('Logins successful!', 'Close', { duration: 2000 });
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const userId = userData?.userId;
        const profileCompletion = userData?.profileCompletion;
        if(userId && profileCompletion > 0)
        {
          this.router.navigate(['/dashboard']);
        }else
        {
          this.router.navigate(['/user-profile']);
        }
        this.close();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login failed:', err);
        this.snackBar.open(
          err.error?.message || 'Login failed. Please check your credentials.',
          'Close',
          { duration: 4000 }
        );

        // alert('Invalid username or password. Please try again.');
      }
    });
  }

  // ❌ Close Dialog
 close(): void {
    // Close login dialog if open
    if (this.loginDialogRef) {
      this.loginDialogRef.close();
    }

    // Close profile dialog if open
    if (this.profileDialogRef) {
      this.profileDialogRef.close();

      // Check sessionStorage before navigating
      const viewContactUserId = sessionStorage.getItem('viewContactUserId');

      // Only navigate to /welcome if 'viewContactUserId' is NOT set
      if (!viewContactUserId) {
        // Check if 'id' exists in URL
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          // Remove 'id' from URL without reloading
          this.router.navigate(['/welcome'], { replaceUrl: true });
        }
      }
    }
  }


  // 🔓 Open Login Dialog
  openLoginDialog(profileUserId?: string): void {
    if (profileUserId) {
      console.log("User profileID", profileUserId);
      sessionStorage.setItem('viewContactUserId', profileUserId);
    }
    
    if (this.profileDialogRef) {
      this.profileDialogRef.close();
    }
    
    this.loginDialogRef = this.dialog.open(this.loginDialog, {
      panelClass: 'login-dialog-panel',
      width: '400px',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
      disableClose: false // ✅ allows outside click to close
    });
  }

  openRegisterDialog(): void 
  {
    if (this.loginDialogRef) {
      this.loginDialogRef.close();
    }
    const dialogRef = this.dialog.open(RegisterComponent, {
      width: '500px',
      disableClose: true,
    });

  dialogRef.componentInstance.registerClosed.subscribe((event: { fromRegister: boolean, success: boolean, intent:string }) => {
      dialogRef.close();
      // Explicit login intent
      if (event.intent === 'login') {
        this.openLoginDialog();
        return;
      }
      // Only open login dialog if registration failed
      if (event.fromRegister && !event.success) {
        this.openLoginDialog();
      }
    });

  }


  // 👤 Open Profile View Dialog
  openProfileDialog(profile: any): void {
    this.showDialog = true; // pause auto-scroll
    this.profileDialogRef = this.dialog.open(this.profileDialog, {
      width: '600px',
      data: profile
    });

    this.profileDialogRef.afterClosed().subscribe(() => {
      this.showDialog = false; // resume auto-scroll
    });
  }

  // 🧭 Filter Occupation Autocomplete
  onOccupationInputChange(value: string): void {
    const filterValue = value?.toLowerCase() || '';
    this.filteredOccupations = of(
      this.occupations.filter(occupation =>
        occupation.toLowerCase().includes(filterValue)
      )
    );
  }

  // ✅ Function to open forgot-password
  goToForgotPassword(event: Event) {
    event.preventDefault(); // prevents default <a> tag navigation

    if (this.loginDialogRef) {
      this.loginDialogRef.close();
    }

    const forgetdialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '420px',
      maxWidth: '90vw',
      // minHeight: '460px',     // optional (for screenshot-like look)
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'forgot-password-dialog'
    });

    forgetdialogRef.componentInstance.forgotClosed.subscribe((event: { fromRegister: boolean, success: boolean, intent:string }) => {
      forgetdialogRef.close();
      // Explicit login intent
      if (event.intent === 'login') {
        this.openLoginDialog();
        return;
      }
    });
  }



  // Mask Phone: show last 4 digits only
  maskedPhone(phone: string): string {
    if (!phone) return '';
    const visibleDigits = 1 ;
    const maskedLength = phone.length - visibleDigits;
    const masked = '*'.repeat(maskedLength);
    // return masked + phone.slice(-visibleDigits);
    return '';
  }

  // Mask Email: show first letter + *** + domain
  maskedEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const name = parts[0];
    const domain = parts[1];
    const firstChar = "$";//name.charAt(0);
    return ""; // firstChar + '***@' + "***"; //domain;
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'images/avatar.png';
  }
  /** =========================
   * OCCUPATION SEARCH LOGIC
   * ========================= */

  // private initOccupationSearch(): void {
  //   this.filteredOccupationGroups$ = this.occupationSearchCtrl.valueChanges.pipe(
  //     startWith(''),
  //     debounceTime(200),
  //     distinctUntilChanged(),
  //     map(value => this.filterOccupationGroups(value ?? '')),
  //     takeUntil(this.destroy$)
  //   );
  // }
  private initOccupationSearch(): void {
    this.occupationSearchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      map(value => this.filterOccupationGroups(value ?? '')),
      takeUntil(this.destroy$)
    ).subscribe(groups => {
      this.filteredOccupationGroups$.next(groups);
    });
  }

private filterOccupationGroups(searchText: string): OccupationGroup[] {
    if (!searchText) return this.allOccupationGroups;

    const query = searchText.toLowerCase();

    return this.allOccupationGroups
      .map(group => ({
        category: group.category,
        values: group.values.filter(v => v.toLowerCase().includes(query))
      }))
      .filter(group => group.values.length > 0);
}

  clearSearch(event: MouseEvent) {
    event.stopPropagation(); // Prevent mat-select from closing
    this.occupationSearchCtrl.reset();
    this.occupationSearchCtrl.markAsPristine();
    this.occupationSearchCtrl.markAsUntouched();
  }

  /** =========================
   * FORM GETTER
   * ========================= */
  get occupationCtrl() {
    return this.searchForm.get('careerDetails.occupation');
  }

  isShrunk = false;
  isLoggedIn = true; // connect to auth service later
  @HostListener('window:scroll', [])
  onScroll() {
    this.isShrunk = window.scrollY > 60;
  }

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    const navbarCollapse = document.getElementById('mainNavbar');
    if (this.isMenuOpen) {
      navbarCollapse?.classList.add('show');
    } else {
      navbarCollapse?.classList.remove('show');
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    const navbarCollapse = document.getElementById('mainNavbar');
    navbarCollapse?.classList.remove('show');
  }

  scrollToSearch() {
    const el = document.getElementById('search-profiles-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToProfiles() {
  const section = document.getElementById('search-profiles-section');
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

happyCouples = 0;


animateCounter(target: number, duration: number) {
  let start = 0;
  const increment = Math.ceil(target / (duration / 16));

  const counter = setInterval(() => {
    start += increment;
    if (start >= target) {
      this.happyCouples = target;
      clearInterval(counter);
    } else {
      this.happyCouples = start;
    }
  }, 16);
}

animationId: number | null = null;
direction: number = 1; // 1 = right, -1 = left
scrollSpeed: number = 1;
showDialog: boolean = false;

autoScrollEnabled: boolean = true;

//@ViewChild('scrollContainer') scrollContainer!: ElementRef;

// ---- SSR-safe wrappers ----
private raf(callback: (time: number) => void): number | null {
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    return window.requestAnimationFrame(callback);
  }
  return null;
}

private caf(id: number | null): void {
  if (typeof window !== 'undefined' && 'cancelAnimationFrame' in window && id !== null) {
    window.cancelAnimationFrame(id);
  }
}

/* ===============================
   START AUTO SCROLL
================================ */

startScroll() {

  if (!isPlatformBrowser(this.platformId) || !this.scrollContainer) return;

  const scrollEl = this.scrollContainer.nativeElement;

  const step = () => {

    if (!this.autoScrollEnabled) return;

    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;

    if (!this.showDialog) {

      scrollEl.scrollLeft += this.scrollSpeed * this.direction;

      // Reverse direction at edges
      if (scrollEl.scrollLeft >= maxScroll) this.direction = -1;
      if (scrollEl.scrollLeft <= 0) this.direction = 1;

    }

    this.animationId = this.raf(step);
  };

  this.animationId = this.raf(step);
}

/* ===============================
   STOP AUTO SCROLL (USER ACTION)
================================ */

stopAutoScroll() {
  this.autoScrollEnabled = false;
  this.pauseScroll();
}

/* ===============================
   PAUSE SCROLL
================================ */

pauseScroll() {
  this.caf(this.animationId);
  this.animationId = null;
}

/* ===============================
   RESUME SCROLL (OPTIONAL)
================================ */

resumeScroll() {
  if (this.animationId === null && this.autoScrollEnabled) {
    this.startScroll();
  }
}

/* ===============================
   MANUAL SCROLL BUTTONS
================================ */

scrollLeft() {

  this.stopAutoScroll();

  this.scrollContainer.nativeElement.scrollBy({
    left: -300,
    behavior: 'smooth'
  });

}

scrollRight() {

  this.stopAutoScroll();

  this.scrollContainer.nativeElement.scrollBy({
    left: 300,
    behavior: 'smooth'
  });

}

/* ===============================
   CLEANUP
================================ */

ngOnDestroy(): void {

  this.pauseScroll();

  this.destroy$.next();
  this.destroy$.complete();

}

  openAboutUsDialog(): void 
  {
    if (this.loginDialogRef) {
      this.loginDialogRef.close();
    }
    const dialogRef = this.dialog.open(AboutUsComponent, {
      width: '900px',
      height: '95vh',
      maxHeight: '95vh',
      disableClose: true
    });

    dialogRef.componentInstance.aboutUsClose.subscribe(() => {
      dialogRef.close();
    });

  }

openContactUsDialog(): void {
  if (this.loginDialogRef) {
    this.loginDialogRef.close();
  }

  const dialogRef = this.dialog.open(ContactUsComponent, {
    width: '1000px',
    height: '95vh',
    maxHeight: '95vh',
    panelClass: 'custom-contact-dialog', // optional custom CSS
    disableClose: true
  });

  // Close dialog on event from component
  dialogRef.componentInstance.contactUsClose.subscribe(() => {
    dialogRef.close();
  });

  // Cleanup overlay after close to avoid leftover DOM
  dialogRef.afterClosed().subscribe(() => {
    const overlayContainer = document.querySelector('.cdk-overlay-container');
    if (overlayContainer) {
      overlayContainer.innerHTML = '';
    }
  });
}

  switchLang(lang: 'मराठी' | 'English'): void {
    this.currentLang = lang;
    sessionStorage.setItem('currentLang', this.currentLang);
  }


  profile: any;
  profileNotFound = false;
  selectedProfile: any;  // for dialog

loadProfileById(id: string): void {
  console.log("User ID", id);

  if (!isPlatformBrowser(this.platformId)) {
    return; // SSR safety
  }

  // ✅ Only use profileId, keep main searchForm intact
  const filterData: SearchFilters = {
    profileId: id
  };

  this.loading = true;
  this.errorMessage = '';
  this.noResults = false;

  this.landpageService.searchProfiles(filterData).subscribe({
    next: (res) => {
      this.loading = false;
        console.log("step4: totalResults", res.totalResults);
        console.log("step5: profiles", res.profiles);

      if (res?.totalResults === 1 && res.profiles?.length) {

        // ✅ extract SINGLE profile
        this.selectedProfile = res.profiles[0];

        // ✅ ensure change detection finishes
        setTimeout(() => {
          this.openProfileDialog(this.selectedProfile);
        });
        
        // this.selectedProfile = res.profiles; // store in separate variable
        // this.openProfileDialog(this.selectedProfile); // open dialog
      } else {
        this.noResults = true;
      }
    },
    error: (err) => {
      this.loading = false;
      this.errorMessage = 'Something went wrong. Please try again later.';
      console.error('Search failed:', err);
    }
  });
}


getProfileImage(data: any): string {
  // console.log(data?.photoDetails.profilePicture);
  if (!data?.photoDetails?.profilePicture || data.photoDetails?.profilePicture.length === 0) {
    return 'images/avatar.png';
  }

  let profileThumb = '';

  for (const img of data.photoDetails?.profilePicture) {
    if (!img) continue; // ✅ important null check
    if (img.isProfile === true && img.thumbUrl) {
      profileThumb = img.originalUrl;
      break;
    }
  }

  return (
    this.apiUrl +
    (profileThumb ||
      data.photoDetails?.profilePicture[0]?.originalUrl ||
      '')
  ) || 'images/avatar.png';
}

 getProfileThumb(profile: any): string {
    if (!profile?.photoDetails?.profilePicture?.length) return 'images/avatar.png';

    const profileImg = profile.photoDetails.profilePicture.find(
      (img: any) => profileImg.isProfile
    );

    return profileImg?.thumbUrl || 'images/avatar.png';
  }
  
  viewerOpen = false;
  selectedImages: any[] = [];

  openViewer(images: any[]) {
    this.selectedImages = images;
    this.viewerOpen = true;
  }

  clearFilters(): void {
  // Reset the form fields
  this.searchForm.reset({
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

  // Reset occupation search input
  this.occupationSearchCtrl.setValue('');

  // Reset filtered occupations to full list
// Instead of Observable<OccupationGroup[]>
  this.filteredOccupationGroups$ = new BehaviorSubject<OccupationGroup[]>(this.allOccupationGroups);

  // Trigger search immediately
  this.onSearch();
}



selectedSeeking: string = '';
selectSeeking(type: string) {

  this.selectedSeeking = type;

  this.searchForm.patchValue({
    seeking: type
  });

  this.scrollToProfiles();
  this.onSearch();

}

 successStories = [
    {
      image: 'assets/images/couple1.jpg',
      coupleName: 'Amit & Sneha',
      message: 'We found each other through Sushil Maratha and got married happily.'
    },
    {
      image: 'assets/images/couple2.jpg',
      coupleName: 'Rahul & Priya',
      message: 'Thank you for helping us find our perfect match!'
    }
  ];

}

