import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  HostListener,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MaterialModule } from '../material.module';
import { Router } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { UserProfile } from '../models/user-profile';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAHARASHTRA_DATA } from '../utilitydata/maharashtra-data';
import { Observable, Subscription, forkJoin, startWith, map } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { environment } from '../../environments/environment'

interface Step {
  id: string;
  title: string;
  subtitle?: string;
  completed?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-timeline-form',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  // ====== Steps / UI ======
  steps: Step[] = [
    { id: 'personal', title: 'Personal Details', icon: 'person' },
    { id: 'horoscope', title: 'Horoscope Details', icon: 'star' },
    { id: 'family', title: 'Family Details', icon: 'group' },
    { id: 'education', title: 'Education Details', icon: 'school' },
    { id: 'career', title: 'Career Details', icon: 'work' },
    { id: 'lifestyle', title: 'Lifestyle Details', icon: 'favorite' },
    { id: 'partner', title: 'Partner Preferences', icon: 'favorite_border' },
    { id: 'contact', title: 'Contact Details', icon: 'phone' },
    { id: 'photos', title: 'Photos', icon: 'photo_camera' },
    { id: 'additional', title: 'Additional Info', icon: 'info' },
  ];
  activeIndex = 0;

  // ====== ViewChildren / DOM refs ======
  @ViewChild('sidebar', { static: false }) sidebar!: ElementRef;
  @ViewChild('contentContainer', { static: false }) contentContainer!: ElementRef;
  @ViewChildren('section') sections!: QueryList<ElementRef>;
  private apiUrl = environment.apiUrl;

  // ====== Form & data ======
  profileForm!: FormGroup;
  userProfile: UserProfile;
  profileOptions: any = {};
  objectKeys = Object.keys; // helper for template
  maharashtraData = MAHARASHTRA_DATA;
  talukas: string[] = [];
  nativeDistrict = '';
  nativeTaluka = '';
  // private subscriptions: Subscription[] = [];

  // qualifications autocomplete
  qualifications: string[] = [
    'B.E. Computer',
    'B.Tech Mechanical',
    'M.Sc. Physics',
    'M.B.B.S.',
    'B.Com',
    'B.A.',
    'B.Sc. IT',
    '12th (Science)',
    '10th Pass',
  ];
  filteredQualifications!: Observable<string[]>;

  // years list
  years: string[] = [];

  // ====== Image/file handling ======
  selectedProfileFiles: File[] = [];
  selectedFamilyFile: File | null = null;
  profilePhoto: string | null = null; // dataURL preview
  profilePictures: string[] = []; // dataURL previews for multiple
  familyPhoto: string | null = null;

  // uploaded filenames returned by backend
  uploadedImageNames: string[] = [];
  uploadedFamilyPicture = '';

  // server URLs (if returned)
  profilePictureUrls: string[] = [];
  familyPictureUrl: string | undefined;

  // ====== Observer / touch ======
  private observer!: IntersectionObserver | null;
  private touchStartY = 0;
  private touchEndY = 0;
  private touchStartX = 0;
  private touchEndX = 0;

  // ====== Subscriptions ======
  private subscriptions: Subscription[] = [];

  // ====== Dropdown option backups (optional) ======
  // These are fallback arrays so template won't break if profileOptions isn't loaded yet
  subCasteOptionsBackup = ["96 kuli", "Maratha", "Kunbi", "Deshmukh Maratha", "Tirale Kunbi"];
  maritalStatusOptionsBackup = ["Unmarried boy", "Unmarried girl", "Divorcee boy/widower", "Divorcee girl/widow"];
  complexionOptionsBackup = ["Gora", "Sawala", "Gavhal", "Nimgora"];
  bloodGroupOptionsBackup = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Don't know"];
  dietOptionsBackup = ["Vegetarian", "Non Vegetarian"];
  rashiOptionsBackup = ["Mesh","Vrushabh","Mithun","Kark","Sinha","Kanya","Tula","Vrishik","Dhanu","Makar","Kumbh","Meen"];
  nakshatraOptionsBackup = ["Ashwini","Ardra","Ashlesha","Anuradha","Bharani","Chitra","Dhanista","Hasta","Jyeshta","Kritika","Moola","Magha","Mrigasira","Pushya","Purva Phalgini","Purva bhadra","Purva shadha","Punarvasu","Rohini","Swati","Revati","Shatatarka","Shravan","Uttara phalguni","Uttara bhadra","Uttara shadha","Vishakha"];
  charanOptionsBackup = ["1","2","3","4"];
  nadiOptionsBackup = ["Adhya","Madhya","Antya"];
  ganOptionsBackup = ["Dev gan","Manushya gan","Rakshas gan"];
  mangalOptionsBackup = ["Yes","No","Soumya","Nirdosh","Not known"];

  constructor(
    private fb: FormBuilder,
    private profile: ProfileService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.userProfile = new UserProfile();
  }

  // ================= LIFECYCLE =================
  ngOnInit(): void {
    this.initForm();
    // this.loadProfileOptions();
    // optionally load user profile:
    // this.loadUserProfile();

    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => (1990 + i).toString());

    // filtered qualifications observable
    this.filteredQualifications = this.profileForm
      .get('educationDetails.highestQualification')!
      .valueChanges.pipe(startWith(''), map((value) => this._filter(value || '')));

    // listen DOB changes to update age
    const dobSub = this.profileForm.get('personalDetails.dateOfBirth')?.valueChanges.subscribe((dob) =>
      this.updateAge(dob)
    );
    if (dobSub) this.subscriptions.push(dobSub);
  }

  ngAfterViewInit(): void {
    console.log('TimelineComponent View initialized.');
    // setTimeout(() => {
    //   this.loadProfileOptions();
    //   this.loadUserProfile();
    // }, 300); // small delay to ensure DOM refs are ready
    
    try {
      if (
        typeof window !== 'undefined' &&
        'IntersectionObserver' in window &&
        this.contentContainer &&
        this.sections &&
        this.sections.length > 0
      ) {
        const options = { root: this.contentContainer.nativeElement, threshold: 0.5 };
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = (entry.target as HTMLElement).id;
              const index = this.steps.findIndex((step) => step.id === id);
              if (index !== -1) this.activeIndex = index;
            }
          });
        }, options);

        this.sections.forEach((section) => {
          const el = section?.nativeElement;
          if (el && this.observer) this.observer.observe(el);
        });
      } else {
        console.warn('⚠️ IntersectionObserver not initialized: missing DOM refs');
      }
    } catch (error) {
      console.error('❌ Error in ngAfterViewInit:', error);
    }

    // ensure view updates
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    // unsubscribe everything
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.observer) this.observer.disconnect();
  }

  // ================= FORM INIT =================
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
        lens: [''],
      }),
      horoscopeDetails: this.fb.group({
        rashi: [''],
        nakshatra: [''],
        charan: [''],
        nadi: [''],
        gan: [''],
        mangal: [''],
        birthTime: ['', Validators.required],
        birthPlace: ['', Validators.required],
        deva: [''],
      }),
      familyDetails: this.fb.group({
        father: [''],
        fatherName: ['', Validators.required],
        fatherOccupation: [''],
        mother: [''],
        motherName: ['', Validators.required],
        motherOccupation: [''],
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
        familyType: [''],
      }),
      educationDetails: this.fb.group({
        highestQualification: [''],
        collegeName: [''],
        yearOfCompletion: [''],
        additionalQualifications: [''],
        educationType: [''],
      }),
      careerDetails: this.fb.group({
        occupation: [''],
        jobTitle: [''],
        companyName: [''],
        annualIncome: [''],
        workLocationCity: [''],
        workLocationCountry: [''],
        employmentType: [''],
        previousWorkExperience: [''],
      }),
      lifestyleDetails: this.fb.group({
        diet: [''],
        smoking: [''],
        drinking: [''],
        hobbies: [''],
        sportsActivities: [''],
        favoriteBooks: [''],
        favoriteMovies: [''],
        favoritetvShows: [''],
      }),
      partnerPreferencesDetails: this.fb.group({
        ageRange: [''],
        heightPreference: [''],
        religionCastePreferences: [''],
        educationPreferences: [''],
        occupationPreferences: [''],
        locationPreferences: [''],
        languagesPreferences: [''],
        lifestylePreferences: [''],
      }),
      contactDetails: this.fb.group({
        emailAddress: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        city: [''],
        state: [''],
        country: [''],
      }),
      photoDetails: this.fb.group({
        profilePicture: [[null]],
        familyPicture: [null],
      }),
      additionalInfoDetails: this.fb.group({
        personalDescription: ['', Validators.maxLength(1000)],
        reasonForPartner: ['', Validators.maxLength(1000)],
        partnerExpectations: ['', Validators.maxLength(1000)],
      }),
    });
  }

  // ================= API CALLS =================
  loadProfileOptions(): void {
    console.log('loadProfileOptions() called');
    const optSub = this.profile.getProfileOptions1().subscribe({
      next: (data) => {
        console.log('API response:', data);
        this.profileOptions = data || {};
      },
      error: (err) => {
        console.error('Error fetching profile options:', err);
        this.snackBar.open('Failed to load profile options', 'Close', { duration: 3000, panelClass: ['snackbar-error'] });
      },
    });
    this.subscriptions.push(optSub);
  }

  loadUserProfile(): void {
    const profileSub = this.profile.getUserProfile().subscribe({
      next: (data) => {
        if (data) {
          this.userProfile = data;
          try {
            this.profileForm.patchValue(data);
          } catch (e) {
            console.warn('Patch form warning:', e);
          }

          const profilePics = this.userProfile.photoDetails?.profilePicture || [];
          this.profilePictureUrls = Array.isArray(profilePics) ? profilePics.map((p: any) => `${this.apiUrl}/uploads/${p.filename}`) : [];
          const familyPic = this.userProfile.photoDetails?.familyPicture;
          if (familyPic?.filename) 
          {
            this.familyPictureUrl = `${this.apiUrl}/uploads/${familyPic.filename}`;          
          }
        } else {
          console.warn('User profile data is empty.');
        }
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
      },
    });
    this.subscriptions.push(profileSub);
  }

  // ================= SUBMIT =================
  onSubmit(): void {
    if (!this.profileForm.valid) {
      this.snackBar.open('Please fill all required fields correctly!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snackbar-error'],
      });
      this.logInvalidControls(this.profileForm);
      return;
    }

    const payload = { ...this.profileForm.value };
    const updateSub = this.profile.updateUserProfile(payload).subscribe({
      next: (data) => {
        this.snackBar.open('Profile updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success'],
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.snackBar.open('Error updating profile. Please try again!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error'],
        });
        console.error('Error updating profile:', error);
      },
    });

    this.subscriptions.push(updateSub);
  }

  // ================= LOG INVALID CONTROLS =================
  logInvalidControls(formGroup: FormGroup, parentPath: string = ''): void {
    Object.keys(formGroup.controls).forEach((controlName) => {
      const control = formGroup.get(controlName);
      const fullPath = parentPath ? `${parentPath}.${controlName}` : controlName;

      if (control instanceof FormGroup) {
        this.logInvalidControls(control, fullPath);
      } else if (control && control.invalid) {
        console.warn(`❌ Invalid field: ${fullPath}`, control.errors);
      }
    });
  }

  // ================= FILE HANDLERS =================
  handleFileInput(event: Event, type: 'profile' | 'multiple' | 'family') {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    if (type === 'profile') {
      const file = input.files[0];
      if (file) {
        this.selectedProfileFiles = [file];
        this.readFile(file, (result) => (this.profilePhoto = result));
      }
    } else if (type === 'multiple') {
      this.selectedProfileFiles = Array.from(input.files);
      this.profilePictures = [];
      Array.from(input.files).forEach((file) => this.readFile(file, (result) => this.profilePictures.push(result)));
    } else if (type === 'family') {
      const file = input.files[0];
      if (file) {
        this.selectedFamilyFile = file;
        this.readFile(file, (result) => (this.familyPhoto = result));
      }
    }
  }

  private readFile(file: File, callback: (result: string) => void) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removePhoto(type: 'profile' | 'multiple' | 'family', index?: number): void {
    if (type === 'profile') {
      this.profilePhoto = null;
      this.selectedProfileFiles = [];
    } else if (type === 'multiple' && index !== undefined) {
      this.profilePictures.splice(index, 1);
      this.selectedProfileFiles.splice(index, 1);
    } else if (type === 'family') {
      this.familyPhoto = null;
      this.selectedFamilyFile = null;
    }
  }

  // upload single/multiple using existing ProfileService.uploadImage(file)
  uploadPhotos(type: 'profile' | 'multiple' | 'family'): void {
    if (type === 'profile') {
      if (!this.selectedProfileFiles.length) return;
      const file = this.selectedProfileFiles[0];
      const upSub = this.profile.uploadImage(file).subscribe({
        next: (filename: string) => {
          this.uploadedImageNames.push(filename);
          this.profileForm.get('photoDetails')?.patchValue({ profilePicture: [filename] });
          this.snackBar.open('Profile photo uploaded!', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Upload error', err);
          this.snackBar.open('Failed to upload profile photo', 'Close', { duration: 2000 });
        },
      });
      this.subscriptions.push(upSub);
    } else if (type === 'multiple') {
      if (!this.selectedProfileFiles.length) return;
      const uploadObservables = this.selectedProfileFiles.map((file) => this.profile.uploadImage(file));
      const upSub = forkJoin(uploadObservables).subscribe({
        next: (filenames: string[]) => {
          this.uploadedImageNames.push(...filenames);
          this.profileForm.get('photoDetails')?.patchValue({ profilePicture: filenames });
          this.snackBar.open('Images uploaded successfully!', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Image upload failed', err);
          this.snackBar.open('Image upload failed.', 'Close', { duration: 2000 });
        },
      });
      this.subscriptions.push(upSub);
    } else if (type === 'family') {
      if (!this.selectedFamilyFile) return;
      const upSub = this.profile.uploadImage(this.selectedFamilyFile).subscribe({
        next: (filename: string) => {
          this.uploadedFamilyPicture = filename;
          this.profileForm.get('photoDetails')?.patchValue({ familyPicture: filename });
          this.snackBar.open('Family picture uploaded successfully!', 'Close', { duration: 2000 });
        },
        error: (err) => {
          console.error('Family picture upload failed', err);
          this.snackBar.open('Failed to upload family picture.', 'Close', { duration: 2000 });
        },
      });
      this.subscriptions.push(upSub);
    }
  }

  deleteImage(imageUrl: string, imgtype: string): void {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const delSub = this.profile.deleteImage(fileName, imgtype).subscribe({
      next: () => {
        this.uploadedImageNames = this.uploadedImageNames.filter((img) => img !== imageUrl);
        this.snackBar.open('Image deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error('Failed to delete image:', err);
        this.snackBar.open('Failed to delete image', 'Close', { duration: 2000 });
      },
    });
    this.subscriptions.push(delSub);
  }

  // ================= MISC HELPERS =================
  onValueChange(event: any): void {
    // used by your template maybe
    // keep reference to field value if required
    // example target: <input (input)="onValueChange($event)">
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  // ======== SWIPE / TOUCH ========
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartY = event.changedTouches[0].screenY;
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndY = event.changedTouches[0].screenY;
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleVerticalSwipe();
    this.handleHorizontalSwipe();
  }

  private handleVerticalSwipe() {
    const deltaY = this.touchStartY - this.touchEndY;
    if (Math.abs(deltaY) > 50) { // Minimum vertical swipe distance
      if (deltaY > 0 && this.activeIndex < this.steps.length - 1) this.scrollToSection(this.activeIndex + 1);
      else if (deltaY < 0 && this.activeIndex > 0) this.scrollToSection(this.activeIndex - 1);
    }
  }

  private handleHorizontalSwipe() {
    const deltaX = this.touchStartX - this.touchEndX;
    if (Math.abs(deltaX) > 50 && this.sidebar) {
      const container = this.sidebar.nativeElement as HTMLElement;
      container.scrollBy({ left: deltaX > 0 ? 100 : -100, behavior: 'smooth' });
    }
  }

  value = 0;
  unit = 'feet';
  onUnitToggle(): void {
    console.log(`Unit switched to: ${this.unit}`);
  }
  convertToCm(value: number, unit: string): number {
    if (!value) return 0;
    return unit === 'feet' ? value * 30.48 : value * 2.54;
  }

  // ================== Dropdown getters (use profileOptions if available) ==================
  get subCasteOptions() {
    return Object.values(this.profileOptions.subCaste || this.subCasteOptionsBackup);
  }
  get maritalStatusOptions() {
    return Object.values(this.profileOptions.maritalStatus || this.maritalStatusOptionsBackup);
  }
  get complexionOptions() {
    return Object.values(this.profileOptions.complexion || this.complexionOptionsBackup);
  }
  get bloodGroupOptions() {
    return Object.values(this.profileOptions.bloodGroup || this.bloodGroupOptionsBackup);
  }
  get dietOptions() {
    return Object.values(this.profileOptions.diet || this.dietOptionsBackup);
  }
  get rashiOptions() {
    return Object.values(this.profileOptions.rashi || this.rashiOptionsBackup);
  }
  get nakshatraOptions() {
    return Object.values(this.profileOptions.nakshatra || this.nakshatraOptionsBackup);
  }
  get charanOptions() {
    return Object.values(this.profileOptions.charan || this.charanOptionsBackup);
  }
  get nadiOptions() {
    return Object.values(this.profileOptions.nadi || this.nadiOptionsBackup);
  }
  get ganOptions() {
    return Object.values(this.profileOptions.gan || this.ganOptionsBackup);
  }
  get mangalOptions() {
    return Object.values(this.profileOptions.mangal || this.mangalOptionsBackup);
  }

  // ================= DISTRICT / TALUKA =================
  onDistrictChange(): void {
    const selectedDistrict = this.profileForm.get('familyDetails.nativeDistrict')?.value;
    const district = this.maharashtraData.districts.find((d: any) => d.name === selectedDistrict);
    this.talukas = district ? district.talukas : [];
    this.profileForm.get('familyDetails.nativeTaluka')?.reset();
    console.log('Selected District:', selectedDistrict);
    console.log('Updated Talukas:', this.talukas);
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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.qualifications.filter((option) => option.toLowerCase().includes(filterValue));
  }

  // ================= TIMELINE / SCROLL =================
  private initIntersectionObserver(): void {
    if (!this.contentContainer) return;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const options = { root: this.contentContainer.nativeElement, threshold: 0.5 };
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).id;
            const index = this.steps.findIndex((s) => s.id === id);
            if (index !== -1) this.activeIndex = index;
          }
        });
      }, options);

      this.sections.forEach((section) => {
        try {
          this.observer!.observe(section.nativeElement);
        } catch (e) {
          // ignore
        }
      });
    }
  }

  scrollToSection(index: number) {
    const section = this.sections.toArray()[index]?.nativeElement;
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeIndex = index;
    }
  }
}
