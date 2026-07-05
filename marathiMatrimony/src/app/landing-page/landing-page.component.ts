import { 
  AfterViewInit, 
  ChangeDetectorRef, 
  Component, 
  OnInit, 
  ViewChild, 
  OnDestroy,
  TemplateRef,
  inject,
  PLATFORM_ID
} from '@angular/core';
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
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { SearchFilters, LandingpageService } from '../services/landingpage.service';
import { OCCUPATIONS, OCCUPATION_GROUPS } from '../utilitydata/occupations-data';
import { LoginRequest } from '../models/auth.model';
import { RegisterComponent } from '../register-new/register.component';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment'
import { isPlatformBrowser } from '@angular/common';


interface OccupationGroup {
  category: string;
  values: string[];
}


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  standalone: true,
  imports: [
    CarouselModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
  ]
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('loginDialog') loginDialog!: TemplateRef<any>;
  @ViewChild('profileDialog') profileDialog!: TemplateRef<any>;


  /** =========================
   * OCCUPATION FILTER (NEW)
   * ========================= */
  occupationSearchCtrl: FormControl = new FormControl('');
  filteredOccupationGroups$!: Observable<OccupationGroup[]>;

  private allOccupationGroups: OccupationGroup[] = OCCUPATION_GROUPS;
  private destroy$ = new Subject<void>();


  // occupationGroups = OCCUPATION_GROUPS;

  // occupationSearchCtrl = new FormControl('');
  // filteredOccupationGroups$!: Observable<any[]>;

  // private destroy$ = new Subject<void>();

  filtersoccupation = { occupation: '' };
  occupations = OCCUPATIONS;
  filteredOccupations!: Observable<string[]>;
  apiUrl = environment.apiUrl;

  searchForm!: FormGroup;
  loginForm!: FormGroup;

  private loginDialogRef!: MatDialogRef<any>;
  private profileDialogRef!: MatDialogRef<any>;

  hidePassword = true;
  isLoading = false;

  customOptions: OwlOptions = {
    loop: true,
    margin: 1,
    nav: true,
    dots: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    responsive: {
      0: { items: 1 },
      600: { items: 2 },
      1000: { items: 3 }
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
    private snackBar: MatSnackBar
    ) {}

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.clear();
      localStorage.clear();
    }

    this.searchForm = this.fb.group({
      iAm: [''],
      seeking: [''],
      toage: [30],
      fromage: [18],
      castes: [''],
      maritialstatus: [''],
      occupationtype: ['']
    });

    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required],
    });

   // ✅ Check query params for login
    this.route.queryParams.subscribe(params => {
      if (params['showLogin'] === 'true') {
        // open login dialog automatically
        setTimeout(() => this.openLoginDialog(), 300);
      }
    });

        this.initOccupationSearch();


  }

  ngAfterViewInit(): void {
    // this.onSearch();
    this.cdr.detectChanges();
  }

  // 🔍 Search Profiles
  onSearch() {
    if (this.searchForm.valid) {
      const filterData: SearchFilters = this.searchForm.value;
      this.loading = true;
      this.errorMessage = '';
      this.noResults = false;

      this.landpageService.searchProfiles(filterData).subscribe({
        next: (res) => {
          this.loading = false;
          this.profiles = res || [];
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
  }

  // 🔐 Login
  login(): void {
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
        this.snackBar.open('Login successful!', 'Close', { duration: 2000 });
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
    if (this.loginDialogRef) {
      this.loginDialogRef.close();
    }

     if (this.profileDialogRef) {
      this.profileDialogRef.close();
    }
  }

  // 🔓 Open Login Dialog
  openLoginDialog(): void {

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

  openRegisterDialog(): void {
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
    this.profileDialogRef = this.dialog.open(this.profileDialog, {
      width: '600px',
      data: profile
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

  // goToForgotPassword() {
  //   this.close();
  //   this.router.navigate(['/forgot-password']);
  // }

   // ✅ Function to navigate to forgot-password
  goToForgotPassword(event: Event) {
    event.preventDefault(); // prevents default <a> tag navigation
    if (this.loginDialogRef) {
      this.loginDialogRef.close();
    }
    this.router.navigate(['/forgot-password']);
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


  viewer = {
  open: false,
  image: '',
  zoom: 1,
  posX: 0,
  posY: 0,
  dragging: false,
  startX: 0,
  startY: 0
};

openViewer(img: string) {
  if(!img) return;
  this.viewer.open = true;
  this.viewer.image = img;
  this.resetZoom();
}

closeViewer(){ this.viewer.open = false; }

zoomIn(){ this.viewer.zoom += 0.2; }
zoomOut(){ if(this.viewer.zoom > 0.5) this.viewer.zoom -= 0.2; }
resetZoom(){
  this.viewer.zoom = 1;
  this.viewer.posX = 0;
  this.viewer.posY = 0;
}

/* Drag image */
startDrag(event:any){
  this.viewer.dragging = true;
  this.viewer.startX = event.clientX - this.viewer.posX;
  this.viewer.startY = event.clientY - this.viewer.posY;
}

onDrag(event:any){
  if(!this.viewer.dragging) return;
  this.viewer.posX = event.clientX - this.viewer.startX;
  this.viewer.posY = event.clientY - this.viewer.startY;
}

stopDrag(){ this.viewer.dragging = false; }

/* Wheel zoom */
zoomScroll(e:any){
  if(e.deltaY < 0) this.zoomIn();
  else this.zoomOut();
}


 ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  /** =========================
   * OCCUPATION SEARCH LOGIC
   * ========================= */

  private initOccupationSearch(): void {
    this.filteredOccupationGroups$ = this.occupationSearchCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      map(value => this.filterOccupationGroups(value ?? '')),
      takeUntil(this.destroy$)
    );
  }

  private filterOccupationGroups(searchText: string): OccupationGroup[] {
    if (!searchText) return this.allOccupationGroups;

    const query = searchText.toLowerCase();

    return this.allOccupationGroups
      .map(group => ({
        category: group.category,
        values: group.values.filter((v: string) =>
          v.toLowerCase().includes(query)
        )
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



}
