import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged, takeUntil, filter } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatRadioModule } from '@angular/material/radio';

import { Observable, Subscription, forkJoin, startWith, map, of, Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormGroupDirective, FormArray,FormControl } from '@angular/forms';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';

import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { ProfilePdfService } from '../services/profile-pdf.service';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { FooterComponent } from '../footer/footer.component';

import { MaterialModule } from '../material.module';
import { ProfileService } from '../services/profile.service';
// import { SidenavService } from '../services/sidenav.service';
import { UserProfile } from '../models/user-profile';

import { MAHARASHTRA_DATA } from '../utilitydata/maharashtra-data';
import { environment } from '../../environments/environment';
import { OCCUPATIONS, OCCUPATION_GROUPS } from '../utilitydata/occupations-data';
import { SidenavMenuService } from '../services/sidenav-menu.service';
import { LANGUAGES } from '../utilitydata/language-data';
import { INDIAN_CITIES, City } from '../utilitydata/country-state-data';
import { QUALIFICATIONS } from '../utilitydata/occupations-data';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';
  @Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [
      HeaderComponent,
      SidenavComponent,
      FooterComponent,
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      RouterModule,
      MatStepperModule,
      MatRadioModule,
      NgxMatSelectSearchModule,
      MatAutocompleteModule
    ],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'mr-IN' }],
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.css'],
    animations: [
      trigger('stepAnimation', [
        transition(':increment', [
          style({ opacity: 0, transform: 'translateX(30px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
        ]),
        transition(':decrement', [
          style({ opacity: 0, transform: 'translateX(-30px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
        ])
      ])
    ]
  })

export class UserProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  apiUrl = environment.apiUrl;
  profileForm!: FormGroup;
  userProfile: UserProfile;

  profileOptions: any = {};
  value: number = 0;
  unit: string = 'feet';

  @ViewChildren('timelineStep') timelineSteps!: QueryList<ElementRef>;
  @ViewChild('sidenav') sidenav!: MatSidenav;

  /** =========================
   * OCCUPATION FILTER (NEW)
   * ========================= */
  occupationGroups = OCCUPATION_GROUPS;

  occupationSearchCtrl = new FormControl('');
  filteredOccupationGroups$!: Observable<any[]>;

  private destroy$ = new Subject<void>();

  private toggleSubscription!: Subscription;

  profilePictures: File[] = [];
  uploadedImageNames: string[] = [];
  familyPicture: File | null = null;
  uploadedImages: string[] = [];
  uploadedFamilyPicture: string = '';
  uploadedProfilePictures: string[] = [];
  profilePictureUrls: any[] = []; // initialize
  // familyPictureUrl: string | undefined;
  familyPictureUrl: string | null = null;

  maharashtraData = MAHARASHTRA_DATA;
  nativeDistrict: string = '';
  nativeTaluka: string = '';
  talukas: string[] = [];
  filteredQualifications$!: Observable<string[]>;
  showAddOption = false;
  qualifications = QUALIFICATIONS;
  // qualifications: string[] = [
  //   'B.E. Computer',
  //   'B.Tech Mechanical',
  //   'M.Sc. Physics',
  //   'M.B.B.S.',
  //   'B.Com',
  //   'B.A.',
  //   'B.Sc. IT',
  //   '12th (Science)',
  //   '10th Pass'
  // ];
  filteredQualifications!: Observable<string[]>;
  formSubmitted = false;
  years: string[] = [];

  // timeline
  selectedIndex = 0;
  steps = [
    { label: 'Basic Details', id: 'personalDetails' },
    { label: 'Horoscope Details', id: 'horoscopeDetails' },
    { label: 'Family Details', id: 'familyDetails' },
    { label: 'Education', id: 'educationDetails' },
    { label: 'Career', id: 'careerDetails' },
    { label: 'Lifestyle', id: 'lifestyleDetails' },
    { label: 'Partner Preferences', id: 'partnerPreferencesDetails' },
    { label: 'Contact Details', id: 'contactDetails' },
    { label: 'ID Proof & Photos', id: 'photoDetails' },
    { label: 'Additional Info', id: 'additionalInfoDetails' }
  ];

  private subscriptions: Subscription[] = [];
  selectedProfileImage: string | null = null;

  languageList: string[] = LANGUAGES;
  filteredCities!: Observable<City[]>;
  districtFilterCtrl = new FormControl('');
  filteredDistricts: any[] = [];

  constructor(
    private fb: FormBuilder,
    private profile: ProfileService,
    // private sidenavService: SidenavService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router,
    public sidenavMenuService: SidenavMenuService, // public to use in template
    private pdfservice: ProfilePdfService, 
    private sanitizer: DomSanitizer,   // 👈 THIS LINE IS REQUIRED
    private http: HttpClient

  ) {
    this.userProfile = new UserProfile();
  }

  // ---------------------
  // Lifecycle
  // ---------------------
  ngOnInit(): void 
  {
    // 1️⃣ Initialize form and occupation search
    this.initForm();
    this.initOccupationSearch();

    // 2️⃣ Fetch profile options
    const optSub = this.profile.getProfileOptions().subscribe({
      next: (data) => {
        this.profileOptions = data || {};
      },
      error: (err) => console.error('Error fetching profile options:', err)
    });
    this.subscriptions.push(optSub);

    // 3️⃣ Fetch user profile
    const profileSub = this.profile.getUserProfile().subscribe({
      next: (data: any) => {
        if (!data) {
          console.warn('User profile data is empty.');
          return;
        }

        this.userProfile = data;
        this.profileForm.patchValue(data); // conservative patch
        const nativeDistrict = this.profileForm.get('familyDetails.nativeDistrict')?.value;

        if (nativeDistrict) {
          this.loadTalukas(nativeDistrict);
        }
        // ===== Handle profile pictures =====
        const profilePics = data.photoDetails?.profilePicture || [];

        // Build URLs for display
        this.profilePictureUrls = profilePics.map(
          (pic: { filename: string }) => `${this.apiUrl}/uploads/profile/originals/${pic.filename}`
        );

        // Preselect the profile picture in the form
        const selectedPic = profilePics.find((pic: { isProfile: boolean }) => pic.isProfile);
        if (selectedPic) {
          this.selectedProfileImage = `${this.apiUrl}/uploads/profile/originals/${selectedPic.filename}`;
        } else if (profilePics.length) {
          // fallback: first image as default
          profilePics[0].isProfile = true;
          this.selectedProfileImage = `${this.apiUrl}/uploads/profile/originals/${profilePics[0].filename}`;
        }

        // Update form control with picture objects
        const photoGroup = this.profileForm.get('photoDetails');
        if (photoGroup) {
          photoGroup.get('profilePicture')?.setValue(profilePics);
        }

        // ===== Handle family picture =====
        const familyPic = data.photoDetails?.familyPicture;
        this.familyPictureUrl = familyPic?.filename
          ? `${this.apiUrl}/uploads/${familyPic.filename}`
          : null;

        // ===== Handle ID proof =====
        const idProofFile = data.photoDetails?.idProof?.filename;
        this.uploadedIdProof = idProofFile
          ? `${this.apiUrl}/uploads/${idProofFile}`
          : null;
      },
      error: (err) => console.error('Error fetching user profile:', err)
    });
    this.subscriptions.push(profileSub);

    // 4️⃣ Reactive family details patching
    const familyControls = [
      { control: 'familyDetails.hasBrothers', count: 'familyDetails.brothersCount', married: 'familyDetails.brothersMarriedCount' },
      { control: 'familyDetails.hasSisters', count: 'familyDetails.sistersCount', married: 'familyDetails.sistersMarriedCount' }
    ];

    familyControls.forEach(({ control, count, married }) => {
      const ctrl = this.profileForm.get(control);
      const countCtrl = this.profileForm.get(count);
      const marriedCtrl = this.profileForm.get(married);

      if (ctrl && countCtrl && marriedCtrl) {
        // Set counts to 0 if user selects "No"
        ctrl.valueChanges.subscribe(val => {
          if (val === 'No') {
            countCtrl.setValue(0, { emitEvent: false });
            marriedCtrl.setValue(0, { emitEvent: false });
          }
        });

        // Married count must always be <= total count
        countCtrl.valueChanges.subscribe(cnt => {
          if (cnt === 0) {
            marriedCtrl.setValue(0, { emitEvent: false });
          } else if (marriedCtrl.value > cnt) {
            marriedCtrl.setValue(cnt, { emitEvent: false });
          }
        });
      }
    });

     this.filteredCities = this.profileForm.get('horoscopeDetails.birthPlace')!
    .valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value?.name),
      map(name => name ? this._filterCities(name) : INDIAN_CITIES.slice())
    );



   // initial load
    this.filteredDistricts = this.maharashtraData.districts;

    // filter logic
    this.districtFilterCtrl.valueChanges
    .pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    )
    .subscribe(search => {
      const searchValue = (search ?? '').toLowerCase();

      this.filteredDistricts =
        this.maharashtraData.districts.filter(d =>
          d.name.toLowerCase().includes(searchValue)
        );
    });
  

    // const qualificationControl =
    // this.profileForm.get('educationDetails.highestQualification');

    // this.filteredQualifications = qualificationControl!.valueChanges.pipe(
    //   startWith(''),
    //   debounceTime(300),
    //   distinctUntilChanged(),
    //   map(value => this.filterQualification(value || ''))
    // );


  this.filteredQualifications$ = this.qualificationControl.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      map(value => this.filter(value))
    );

// AutoSave Draft
    this.profileForm.valueChanges
      .pipe(
        debounceTime(1500),
        distinctUntilChanged(),
        filter(() => this.profileForm.dirty),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.autoSaveDraft(value);
    });
  }


loadTalukas(selectedDistrict: string): void {

  const district = this.maharashtraData.districts
    .find(d => d.name === selectedDistrict);

  this.talukas = district ? district.talukas : [];
}


private _filterCities(value: string): City[] {
  const filterValue = value.toLowerCase();

  return INDIAN_CITIES.filter(city =>
    city.name.toLowerCase().includes(filterValue)
  );
}

displayCity(city: City): string {
  return city ? `${city.name}, ${city.state}` : '';
}

selectCity(event: any) {
  const selectedCity = event.option.value;

  this.profileForm.patchValue({
    horoscopeDetails: {
      birthPlace: selectedCity
    }
  });
}
  ngAfterViewInit(): void {
    // this.toggleSubscription = this.sidenavService.toggle$.subscribe(() => {
    //   this.sidenav?.toggle();
    // });

    // ensure viewchildren are ready
    setTimeout(() => this.scrollActiveIntoView(), 50);
  }

  ngOnDestroy(): void {
    this.toggleSubscription?.unsubscribe();
    this.subscriptions.forEach(s => s.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------
  // Form init
  // ---------------------
  private initForm(): void {
    this.profileForm = this.fb.group({
      personalDetails: this.fb.group({
        firstName: ['', Validators.required],
        middleName: ['', Validators.required],
        lastName: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        age: [0, Validators.required],
        gender: ['', Validators.required],
        religion: ['Hindu', Validators.required],
        caste: ['Maratha', Validators.required],
        subCaste: [''],
        maritalStatus: [''],
        height: ['', Validators.required],
        heightUnit: ['feet'],
        complexion: [''],
        physicalDisability: ['no'],
        disabilityDetails: [''],
        weight: [''],
        bloodGroup: [''],
        languagesSpoken: [''],
        diet: [''],
        spectacles: [''],
        lens: ['']
      }),
      horoscopeDetails: this.fb.group({
        navsarNav: [''],
        rashi: [''],
        nakshatra: [''],
        charan: [''],
        nadi: [''],
        gan: [''],
        mangal: [''],
        birthTime: ['', Validators.required],
        birthPlace: ['', Validators.required],
        deva: ['']
      }),
      familyDetails: this.fb.group({
        father: ['Shri.'],
        fatherName: ['', Validators.required],
        fatherOccupation: [''],
        fatherContactNumber: [''],
        mother: ['Shrimati.'],
        motherName: ['', Validators.required],
        motherOccupation: [''],
        motherContactNumber: [''],
        hasBrothers: [''],
        brothersCount: [''],
        brothersMarriedCount: [''],
        hasSisters: [''],
        sistersCount: [''],
        sistersMarriedCount: [''],
        parentsResidentCity: [''],
        relativesSurnames: [''],
        familyWealth: [''],
        mamaNameAndPlace: [''],
        nativeDistrict: [''],
        otherDistrict: [''],
        nativeTaluka: [''],
        intercasteMarriage: [''],
        intercasteDetails: [''],
        siblingsDetails: [''],
        familyType: ['']
      }),
      educationDetails: this.fb.group({
        highestQualification: ['', Validators.required],
        collegeName: [''],
        yearOfCompletion: [''],
        additionalQualifications: [''],
        educationType: ['']
      }),
      careerDetails: this.fb.group({
        occupation: ['', Validators.required],
        jobTitle: [''],
        companyName: [''],
        currency: ['₹'], // , Validators.required default ₹
        annualIncome: ['', [Validators.required, Validators.min(0)]],
        unit: ['lakh'], //Validators.required
        pincode: [
            '',
            [
              Validators.pattern(/^[0-9]{6}$/)
            ]
        ],        workLocationCity: [''],
        workLocationState: ['Maharashtra'],
        workLocationCountry: ['India'],
        employmentType: [''],
        previousWorkExperience: ['']
      }),
      lifestyleDetails: this.fb.group({
        diet: [''],
        smoking: [''],
        drinking: [''],
        hobbies: [''],
        sportsActivities: [''],
        favoriteBooks: [''],
        favoriteMovies: [''],
        favoritetvShows: ['']
      }),
      partnerPreferencesDetails: this.fb.group({
        ageRange: [''],
        heightPreference: [''],
        religionCastePreferences: [''],
        educationPreferences: [''],
        occupationPreferences: [''],
        locationPreferences: [''],
        languagesPreferences: [''],
        lifestylePreferences: ['']
      }),
      contactDetails: this.fb.group({
        emailAddress: ['', [Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        whatsappNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        city: [''],
        state: ['Maharashtra'],
        country: ['India']
      }),
      photoDetails: this.fb.group({
        profilePicture: [[]],
        familyPicture: [''],
        idProof:[''],
        idNumber: ['']   // <-- ADD THIS LINE
      }),
      additionalInfoDetails: this.fb.group({
        personalDescription: [''],
        reasonForPartner: [''],
        partnerExpectations: ['']
      }),
      profileCompletion: [0]
    });

    // autocomplete for qualifications
    // this.filteredQualifications = this.profileForm
    //   .get('educationDetails.highestQualification')!
    //   .valueChanges.pipe(
    //     startWith(''),
    //     map(value => this._filter(value || ''))
    // );

    // years list (1990 -> current)
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => (1950 + i).toString());

    // DOB change -> update age
    const dobSub = this.profileForm.get('personalDetails.dateOfBirth')?.valueChanges.subscribe((dob) => {
      this.updateAge(dob);
    });
    if (dobSub) this.subscriptions.push(dobSub);
  }

  // ---------------------
  // Submit + validation highlighting
  // ---------------------
  onSubmit(): void {  
    if (!this.profileForm.valid) {
      this.snackBar.open('Please fill all required fields correctly!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });

      // log invalids for debugging
      this.logInvalidControls(this.profileForm);

      // highlight and jump to the invalid step
      this.highlightInvalidStep();

      return;
    }

      // 🔥 APPLY PROFILE IMAGE HERE
      this.applyProfileImageSelection();

    // form valid -> map to userProfile and send
    this.userProfile = { ...this.profileForm.value } as UserProfile;

    // Calculate profile completion %
    const result = this.calculateCompletionPercentage(this.profileForm);
    const percentage = Math.round((result.filled / result.total) * 100);
    console.log('Percentage = ', percentage)
    this.userProfile.profileCompletion = percentage;

    const updateSub = this.profile.updateUserProfile(this.userProfile).subscribe({
      next: (data) => {
        this.snackBar.open('Profile updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.snackBar.open('Error updating profile. Please try again!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
        console.error('Error updating profile:', error);
      }
    });
    this.subscriptions.push(updateSub);
  }

  logInvalidControls(formGroup: FormGroup, parentPath: string = ''): void {
    Object.keys(formGroup.controls).forEach(controlName => {
      const control = formGroup.get(controlName);
      const fullPath = parentPath ? `${parentPath}.${controlName}` : controlName;

      if (control instanceof FormGroup) {
        this.logInvalidControls(control, fullPath);
      } else if (control && control.invalid) {
        console.warn(`❌ Invalid field: ${fullPath}`, control.errors);
      }
    });
  }

  private highlightInvalidStep(): void {
    const stepIds = this.steps.map(s => s.id);

    for (let i = 0; i < stepIds.length; i++) {
      const group = this.profileForm.get(stepIds[i]);
      if (group && group.invalid) {
        // mark all controls touched in that group
        this.markGroupTouched(group as FormGroup);

        // set selected index to jump
        this.selectedIndex = i;

        // after DOM update, try to scroll active timeline to view
        setTimeout(() => this.scrollActiveIntoView(), 100);
        return;
      }
    }

    // fallback: if no group-level invalid found, mark entire form touched
    this.markGroupTouched(this.profileForm as any);
  }

  private markGroupTouched(group: any): void {
    if (!group || !group.controls) return;

    Object.keys(group.controls).forEach((key) => {
      const ctrl = group.controls[key];
      if (ctrl instanceof FormGroup) {
        this.markGroupTouched(ctrl);
      } else {
        if (ctrl && typeof ctrl.markAsTouched === 'function') {
          ctrl.markAsTouched();
          ctrl.updateValueAndValidity();
        }
      }
    });
  }

  // ---------------------
  // Image upload helpers
  // ---------------------
  onProfilePicturesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const selectedFiles = Array.from(input.files);

      if (selectedFiles.length > 3) {
        alert('You can upload a maximum of 3 images.');
        input.value = '';
        return;
      }

      this.profilePictures = selectedFiles;
      this.profileForm.get('photoDetails.profilePicture')?.setValue(selectedFiles);
    }
  }

  // alternate version used elsewhere in your code
  onProfilePicturesSelected1(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const selectedFiles = Array.from(input.files);

    // limit to 3
    if (selectedFiles.length > 3) {
      alert('You can upload a maximum of 3 images.');
      input.value = '';
      return;
    }

    this.profileForm.get('photoDetails.profilePicture')?.setValue(selectedFiles);
    this.profilePictureUrls = selectedFiles.map(file => URL.createObjectURL(file));
    input.value = '';
  }

  onFamilyPictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.familyPicture = input.files[0];
    }
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  uploadProfilePictures(): void {
    if (!this.profilePictures || this.profilePictures.length === 0) {
      alert('No images selected to upload.');
      return;
    }

    // Limit to max 3 images
    const filesToUpload = this.profilePictures.slice(-3);

    this.profile.uploadImages(filesToUpload).subscribe({
      next: (res: any) => {
        console.log('Upload response:', res);

        const uploadedImages = res.images || [];

        const photoGroup = this.profileForm.get('photoDetails');
        if (photoGroup) {
          photoGroup.get('profilePicture')?.setValue(uploadedImages);
          photoGroup.get('profilePicture')?.updateValueAndValidity();
        }

        this.profilePictureUrls = uploadedImages.map(
          (img: any) => img.originalUrl || `${this.apiUrl}/uploads/profile/originals/${img.filename}`
        );

        if (uploadedImages.length > 0) {
          this.selectedProfileImage = this.profilePictureUrls[uploadedImages.length - 1];
        }

        alert('Images uploaded successfully!');
      },
      error: (err) => {
        console.error('Image upload failed', err);
        alert('Image upload failed.');
      }
    });
  }


  uploadFamilyPicture(): void {
    if (!this.familyPicture) {
      alert('Please select a family picture to upload.');
      return;
    }

    const familySub = this.profile.uploadImage(this.familyPicture).subscribe({
      next: (filename: string) => {
        this.uploadedFamilyPicture = filename;

        this.profileForm.get('photoDetails')?.patchValue({
          familyPicture: filename
        });

        alert('Family picture uploaded successfully!');
      },
      error: (err: any) => {
        console.error('Family picture upload failed', err);
        alert('Failed to upload family picture.');
      }
    });

    this.subscriptions.push(familySub);
  }

  deleteImage(imageUrl: string, imgtype: string): void {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const delSub = this.profile.deleteImage(fileName, imgtype).subscribe({
      next: () => {
        this.uploadedImages = this.uploadedImages.filter(img => img !== imageUrl);
        // also remove from profilePictureUrls if present
        this.profilePictureUrls = this.profilePictureUrls.filter((u: string) => !u.includes(fileName));
      },
      error: (err: any) => {
        console.error('Failed to delete image:', err);
      }
    });

    this.subscriptions.push(delSub);
  }

  deleteIdProof(): void {
    this.profile.deleteIdProof().subscribe({
      next: () => {
        this.uploadedIdProof = null;
        this.idProof = null;

        this.profileForm.get('photoDetails')?.patchValue({
          idProof: null
        });

        alert('ID proof deleted successfully');
      },
      error: err => {
        console.error('Failed to delete ID proof', err);
        alert('Failed to delete ID proof');
      }
    });
  }


  // ---------------------
  // Misc helpers
  // ---------------------
  onValueChange(event: any): void {
    this.value = event.target.value;
  }

  onUnitToggle(): void {
    console.log(`Unit switched to: ${this.unit}`);
  }

  convertToCm(value: number, unit: string): number {
    if (!value) return 0;
    return unit === 'feet' ? value * 30.48 : value * 2.54;
  }

  // dropdown getters
  get subCasteOptions() { return Object.values(this.profileOptions.subCaste || {}); }
  get maritalStatusOptions() { return Object.values(this.profileOptions.maritalStatus || {}); }
  get complexionOptions() { return Object.values(this.profileOptions.complexion || {}); }
  get bloodGroupOptions() { return Object.values(this.profileOptions.bloodGroup || {}); }
  get dietOptions() { return Object.values(this.profileOptions.diet || {}); }
  get rashiOptions() { return Object.values(this.profileOptions.rashi || {}); }
  get nakshatraOptions() { return Object.values(this.profileOptions.nakshatra || {}); }
  get charanOptions() { return Object.values(this.profileOptions.charan || {}); }
  get nadiOptions() { return Object.values(this.profileOptions.nadi || {}); }
  get ganOptions() { return Object.values(this.profileOptions.gan || {}); }
  get mangalOptions() { return Object.values(this.profileOptions.mangal || {}); }

  onToggleSidenav(): void {
    this.sidenav?.toggle();
  }

  // onDistrictChange(): void {
  //   const selectedDistrict = this.profileForm.get('familyDetails.nativeDistrict')?.value;

  //   const district = this.maharashtraData.districts.find(d => d.name === selectedDistrict);
  //   this.talukas = district ? district.talukas : [];

  //   // Reset the taluka field
  //   this.profileForm.get('familyDetails.nativeTaluka')?.reset();

  //   console.log("Selected District:", selectedDistrict);
  //   console.log("Updated Talukas:", this.talukas);
  // }

onDistrictChange(selectedDistrict: string): void {

  const selectedTaluka = this.profileForm.get('nativeTaluka')?.value;

  const district = this.maharashtraData.districts
    .find(d => d.name === selectedDistrict);

  this.talukas = district ? district.talukas : [];

  // If existing taluka does not belong to new district → reset it
  if (!this.talukas.includes(selectedTaluka)) {
    this.profileForm.get('nativeTaluka')?.reset();
  }
}

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.qualifications.filter(option =>
      option.toLowerCase().includes(filterValue)
    );
  }

  onDOBChange(dob: Date): void {
    this.updateAge(dob);
  }

  updateAge(dob: Date | null): void {
    if (!dob) {
      this.profileForm.get('personalDetails.age')?.setValue('');
      return;
    }

    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    this.profileForm.get('personalDetails.age')?.setValue(age);
  }

  // ---------------------
  // Timeline controls
  // ---------------------
  selectStep(index: number) {
    this.selectedIndex = index;
  }

  nextStep() {
    if (this.selectedIndex < this.steps.length - 1) {
      this.selectedIndex++;
    }
  }

  prevStep() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
  }

  get progressHeight() {
    return (this.selectedIndex / (this.steps.length - 1)) * 100;
  }

  /** Auto-scroll the active timeline step into view on mobile */
  scrollActiveIntoView() {
    const activeStep = this.timelineSteps?.get(this.selectedIndex)?.nativeElement;
    if (activeStep && window.innerWidth <= 768) {
      activeStep.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }

  // Check if any section has errors
get hasFormErrors(): boolean {
  if (!this.profileForm) return true;

  // You can check each form group or just the whole form
  return this.profileForm.invalid;
}
  private calculateCompletionPercentage(formGroup: FormGroup | FormArray): { filled: number, total: number } {
    let totalControls = 0;
    let filledControls = 0;

    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key)!;

      if (control instanceof FormGroup || control instanceof FormArray) {
        const nested = this.calculateCompletionPercentage(control);
        filledControls += nested.filled;
        totalControls += nested.total;
      } else {
        totalControls++;
        const value = control.value;
        if (value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
          filledControls++;
        }
      }
    });

    return { filled: filledControls, total: totalControls };
  }

  uploadedIdProof: string | null = null; // store filename returned by backend

   idProof: File | null = null;
  idProofUrl: string | null = null;

  onIdProofSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Allowed formats: JPG, PNG, PDF
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];

    if (!allowed.includes(file.type)) {
      this.snackBar.open('Only JPG, PNG, or PDF allowed', 'Close', { duration: 3000 });
      return;
    }

    this.idProof = file;
  }

  uuploadIdProof(): void {
    if (!this.idProof) {
      alert('Please select an ID proof to upload.');
      return;
    }

    const idProofSub = this.profile.uploadImage(this.idProof).subscribe({
      next: (filename: string) => {
        this.uploadedIdProof = filename;

        // Store inside form object
        this.profileForm.get('photoDetails')?.patchValue({
          idProof: filename
        });

        alert('ID proof uploaded successfully!');
      },
      error: (err: any) => {
        console.error('ID proof upload failed', err);
        alert('Failed to upload ID proof.');
      }
    });

    this.subscriptions.push(idProofSub);
  }

  isImage(url: string | null): boolean {
    return url ? url.match(/\.(jpeg|jpg|png|webp)$/i) !== null : false;
  }

  isPdf(url: string | null): boolean {
    return url ? url.toLowerCase().endsWith('.pdf') : false;
  }


    /* =========================
       OCCUPATION SEARCH LOGIC
    ========================= */

  private initOccupationSearch(): void {

  const occupationControl = this.profileForm.get('careerDetails.occupation');

  this.filteredOccupationGroups$ = occupationControl!.valueChanges.pipe(
    startWith(''),
    map(value => this.filterOccupations(value || ''))
  );

    // this.filteredOccupationGroups$ = this.occupationSearchCtrl.valueChanges.pipe(
    //   startWith(''),
    //   debounceTime(200),
    //   distinctUntilChanged(),
    //   map(value => this.filterOccupationGroups((value ?? '').toString())),
    //   takeUntil(this.destroy$)
    // );
  }


filterOccupations(search: string) {
  const value = search.toLowerCase().trim();

  return this.occupationGroups
    .map(group => ({
      category: group.category,
      values: group.values.filter(option =>
        option.toLowerCase().includes(value)
      )
    }))
    .filter(group => group.values.length > 0);
}


selectOccupation(event: MatAutocompleteSelectedEvent) {
  const value = event.option.value;
  console.log('Selected occupation:', value);
}

highlightOccupation(option: string): SafeHtml {
  const search =
    this.profileForm.get('careerDetails.occupation')?.value || '';

  if (!search) return option;

  const regex = new RegExp(`(${search})`, 'gi');
  const highlighted = option.replace(regex, '<b>$1</b>');

  return this.sanitizer.bypassSecurityTrustHtml(highlighted);
}
  private filterOccupationGroups(search: string): any[] {
    if (!search) return this.occupationGroups;

    const value = search.toLowerCase();

    return this.occupationGroups
      .map(group => ({
        category: group.category,
        values: group.values.filter((v: string) =>
          v.toLowerCase().includes(value)
        )
      }))
      .filter(group => group.values.length > 0);
  }

  /* =========================
     GETTERS
  ========================= */

  get occupationCtrl() {
    return this.profileForm.get('careerDetails.occupation');
  }

  clearSearch(event: MouseEvent) {
    event.stopPropagation(); // Prevent mat-select from closing
    this.occupationSearchCtrl.reset();
    this.occupationSearchCtrl.markAsPristine();
    this.occupationSearchCtrl.markAsUntouched();
  }

  trackByImg(index: number, img: string): string {
    return img;
  }

  private applyProfileImageSelection(): void {
    const photoGroup = this.profileForm.get('photoDetails');
    if (!photoGroup) return;

    const pictures: { filename: string; isProfile?: boolean }[] = photoGroup.get('profilePicture')?.value || [];

    if (!pictures.some(p => p.isProfile) && pictures.length) {
      // fallback: first picture as profile
      pictures[0].isProfile = true;
    }

    photoGroup.get('profilePicture')?.setValue(pictures);
  }

  selectedProfileIndex: number | null = null;

  onProfileImageSelected(index: number) {
    const photoGroup = this.profileForm.get('photoDetails');
    if (!photoGroup) return;

    const pictures = photoGroup.get('profilePicture')?.value || [];

    // Update isProfile
    pictures.forEach((p: any, i: number) => (p.isProfile = i === index));

    photoGroup.get('profilePicture')?.setValue(pictures);

    // Update selectedProfileImage to URL for mat-radio-button
    this.selectedProfileImage = `${this.apiUrl}/uploads/${pictures[index].filename}`;
  }


  loadProfilePhotos(profile: any) {
    // 1️⃣ Patch form
    this.profileForm.patchValue({
      photoDetails: {
        profilePicture: profile.profilePicture,
        idProof: profile.idProof
      }
    });

    // 2️⃣ Build image URLs (THIS IS WHAT UI USES)
    this.profilePictureUrls = profile.profilePicture.map(
      (p: any) => `${this.apiUrl}/uploads/profile/originals/${p.filename}`
    );

    // 3️⃣ Set selected profile image
    const selected = profile.profilePicture.find((p: any) => p.isProfile);
    if (selected) {
      this.selectedProfileImage = `${this.apiUrl}/uploads/profile/originals/${selected.filename}`;
    }

    // 4️⃣ ID proof
    if (profile.idProof) {
      this.uploadedIdProof = `${this.apiUrl}/uploads/${profile.idProof}`;
    }
  }

  getNumberArray(max: number): number[] {
    return max >= 0 ? Array.from({ length: max + 1 }, (_, i) => i) : [];
  }

  uploadIdProof(): void { 
    if (!this.idProof) {
      alert('Please select an ID proof to upload.');
      return;
    }

    const idNumber = this.profileForm.get('photoDetails.idNumber')?.value || '';

    const formData = new FormData();
    formData.append('idProof', this.idProof);  // key matches backend
    formData.append('idNumber', idNumber);

    this.profile.uploadIdProof(formData).subscribe({
      next: (res: any) => {
        const idProof = res.idProof; // 👈 THIS is the fix

        this.uploadedIdProof = idProof.filename;
        this.idProofUrl = idProof.url;

        // ✅ Patch correct value
        this.profileForm
          .get('photoDetails.idProof')
          ?.setValue(idProof.filename);

        this.profileForm
          .get('photoDetails.idNumber')
          ?.setValue(idProof.idNumber || '');

        alert('ID proof uploaded successfully!');
      },
      error: (err: any) => {
        console.error('ID proof upload failed', err);
        alert('Failed to upload ID proof.');
      }
    });
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  downloadPdf() 
  {
      this.pdfservice.generateProfilePdf(this.userProfile);
  }



// Shortcut getter (cleaner template usage)
 get qualificationControl(): FormControl {
  return this.profileForm.get(
    'educationDetails.highestQualification'
  ) as FormControl;
}

  // Filtering logic
  private filter(value: string): string[] {

    if (!value || value.length < 2) {
      this.showAddOption = false;
      return [];
    }

    const lower = value.toLowerCase();

    const results = this.qualifications.filter(q =>
      q.toLowerCase().includes(lower)
    );

    this.showAddOption =
      results.length === 0 &&
      value.length >= 2;

    return results;
  }

  // Safe highlight
  highlight(option: string): SafeHtml {

    const value = this.qualificationControl.value;

    if (!value || value.length < 2) return option;

    const regex = new RegExp(`(${value})`, 'gi');
    const highlighted = option.replace(regex, '<b>$1</b>');

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  openDropdown() {
    if (this.qualificationControl.value?.length >= 2) {
      this.filter(this.qualificationControl.value);
    }
  }

  clear() {
    this.qualificationControl.setValue('');
  }

  // Prepare data for DB
  getIncomePayload() {
    return {
      currency: this.profileForm.get('currency')?.value,
      amount: this.profileForm.get('amount')?.value,
      unit: this.profileForm.get('unit')?.value
    };
  }
  
getFormattedIncome(amount: number, unit: string): string {
  if (!amount || amount <= 0) return 'Not Specified';

  let multiplier = 1;

  switch (unit) {
    case 'thousand':
      multiplier = 1000;
      break;
    case 'lakh':
      multiplier = 100000;
      break;
    case 'crore':
      multiplier = 10000000;
      break;
  }

  const totalIncome = amount * multiplier;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalIncome);
}


  fetchLocationByPincode() {

    const pincode = this.profileForm
      .get('careerDetails.pincode')
      ?.value;

    if (pincode?.length === 6) {

      this.profile
        .getLocationByPincode(pincode)
        .subscribe({

          next: (res) => {

            this.profileForm.patchValue({
              careerDetails: {
                workLocationCity: res.city,
                workLocationState: res.state,
                workLocationCountry: res.country
              }
            });

          },

          error: (err) => {
            console.error("Location fetch failed", err);
          }

        });

    }
  }

isSaving = false;
draftStatus: 'saving' | 'saved' | 'error' = 'saved';
private autoSaveDraft(formValue: any): void {

  if (!this.profileForm.dirty) return;

  const payload = {
    ...formValue,
    isDraft: true
  };

  // 🔥 HERE is your code
  this.draftStatus = 'saving';

  this.profile.saveDraft(payload).subscribe({
    next: () => {
      this.draftStatus = 'saved';
      console.log('✅ Draft saved');
    },
    error: () => {
      this.draftStatus = 'error';
      console.error('❌ Draft save failed');
    }
  });
}

}
