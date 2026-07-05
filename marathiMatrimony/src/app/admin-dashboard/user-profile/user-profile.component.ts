import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Observable, startWith, map } from 'rxjs';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { UserProfile } from '../models/user-profile';
// import { AgeCalPipe } from '../pipes/age-cal.pipe';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { FooterComponent } from '../footer/footer.component';
import { forkJoin, Subscription } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
import { SidenavService } from '../services/sidenav.service';
import { ChangeDetectorRef } from '@angular/core';
import { MAHARASHTRA_DATA } from '../utilitydata/maharashtra-data';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment'

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
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'mr-IN' }
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  profileForm!: FormGroup;
  userProfile: UserProfile;
  profileOptions: any = {};
  value: number = 0;
  unit: string = 'feet';
  private apiUrl = environment.apiUrl;

  @ViewChild('sidenav') sidenav!: MatSidenav;
  private toggleSubscription!: Subscription;

  profilePictures: File[] = [];
  uploadedImageNames: string[] = [];
  familyPicture: File | null = null;
  uploadedImages: string[] = [];
  uploadedFamilyPicture: string = '';

   uploadedProfilePictures: string[] = [];
  profilePictureUrls: any;
  familyPictureUrl: string | undefined;

  maharashtraData = MAHARASHTRA_DATA;
  nativeDistrict: string = '';
  nativeTaluka: string = '';
  talukas: string[] = [];

   qualifications: string[] = [
    'B.E. Computer',
    'B.Tech Mechanical',
    'M.Sc. Physics',
    'M.B.B.S.',
    'B.Com',
    'B.A.',
    'B.Sc. IT',
    '12th (Science)',
    '10th Pass'
  ];
  filteredQualifications!: Observable<string[]>;

  years: string[] = [];


   
  constructor(
    private fb: FormBuilder,
    private profile: ProfileService,
    private sidenavService: SidenavService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.userProfile = new UserProfile();
  }

ngOnInit(): void {
  this.initForm();

  // Fetch profile options
  this.profile.getProfileOptions().subscribe({
    next: (data) => {
      this.profileOptions = data;
    },
    error: (error) => {
      console.error('Error fetching profile options:', error);
    }
  });

  // Fetch user profile and patch form
  this.profile.getUserProfile().subscribe({
    next: (data) => {
      if (data) {
        this.userProfile = data;
        this.profileForm.patchValue(data);

        console.log('User profile:', this.userProfile.photoDetails?.profilePicture);

        // Extract profile pictures
        const profilePics = this.userProfile.photoDetails?.profilePicture || [];
        this.profilePictureUrls = profilePics.map(
          (pic: { filename: string }) => `${this.apiUrl}/uploads/${pic.filename}`
        );

        // Extract family picture
        const familyPic = this.userProfile.photoDetails?.familyPicture;
        console.log('Family pick = ' + familyPic?.filename);
        if (familyPic?.filename) {
          this.familyPictureUrl = `${this.apiUrl}/uploads/${familyPic.filename}`;
        }
        console.log(this.familyPictureUrl)
      } else {
        console.warn('User profile data is empty.');
      }
    },
    error: (error) => {
      console.error('Error fetching user profile:', error);
    },
    complete: () => {
      console.log('User profile fetch completed.');
    }
  });
}

  ngAfterViewInit(): void {
    this.toggleSubscription = this.sidenavService.toggle$.subscribe(() => {
      this.sidenav?.toggle();
    });
  }

  ngOnDestroy(): void {
    this.toggleSubscription?.unsubscribe();
  }

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
        subCaste: ['', Validators.required],
        maritalStatus: ['', Validators.required],
        height: [''],
        heightUnit: ['feet', Validators.required],
        complexion: ['', Validators.required],
        physicalDisability: ['no'],
        disabilityDetails: [''],
        weight: ['', [Validators.required, Validators.min(1)]],
        bloodGroup: ['', Validators.required],
        languagesSpoken: [''],
        diet: [''],
        spectacles: [''],
        lens: ['']
      }),
      horoscopeDetails: this.fb.group({
        rashi: ['', Validators.required],
        nakshatra: ['', Validators.required],
        charan: ['', Validators.required],
        nadi: ['', Validators.required],
        gan: ['', Validators.required],
        mangal: ['', Validators.required],
        birthTime: ['', Validators.required],
        birthPlace: ['', Validators.required],
        deva: ['', Validators.required]
      }),
      familyDetails: this.fb.group({
        father: ['', Validators.required],
        fatherName: [''],
        fatherOccupation: [''],
        mother: ['', Validators.required],
        motherName: [''],
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
        nativeDistrict: ['', Validators.required],
        otherDistrict: [''],
        nativeTaluka: [''],
        intercasteMarriage: ['', Validators.required],
        intercasteDetails: [''],
        siblingsDetails: [''],
        familyType: ['', Validators.required]
      }),
      educationDetails: this.fb.group({
        highestQualification: ['', Validators.required],
        collegeName: ['', Validators.required],
        yearOfCompletion: ['', [Validators.required, Validators.pattern(/^(19|20)\d{2}$/)]],
        additionalQualifications: [''],
        educationType: ['', Validators.required]
      }),
      careerDetails: this.fb.group({
        occupation: ['', Validators.required],
        jobTitle: ['', Validators.required],
        companyName: ['', Validators.required],
        annualIncome: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
        workLocationCity: ['', Validators.required],
        workLocationCountry: ['', Validators.required],
        employmentType: ['', Validators.required],
        previousWorkExperience: ['']
      }),
      lifestyleDetails: this.fb.group({
        diet: ['', Validators.required],
        smoking: ['', Validators.required],
        drinking: ['', Validators.required],
        hobbies: [''],
        sportsActivities: [''],
        favoriteBooks: [''],
        favoriteMovies: [''],
        favoritetvShows: ['']
      }),
      partnerPreferencesDetails: this.fb.group({
        ageRange: [''],
        heightPreference: ['', Validators.required],
        religionCastePreferences: [''],
        educationPreferences: [''],
        occupationPreferences: [''],
        locationPreferences: [''],
        languagesPreferences: [''],
        lifestylePreferences: ['']
      }),
      contactDetails: this.fb.group({
        emailAddress: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        city: ['', Validators.required],
        state: ['', Validators.required],
        country: ['', Validators.required]
      }),
      photoDetails: this.fb.group({
        profilePicture: [[null]],
        familyPicture: [null]
      }),
      additionalInfoDetails: this.fb.group({
        personalDescription: ['', [Validators.required, Validators.maxLength(1000)]],
        reasonForPartner: ['', [Validators.required, Validators.maxLength(1000)]],
        partnerExpectations: ['', [Validators.required, Validators.maxLength(1000)]]
      })
    });


    this.filteredQualifications = this.profileForm.get('educationDetails.highestQualification')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );

    // Generate years from 1990 to current year
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => (1990 + i).toString());

     // Listen to DOB changes within personalDetails
    this.profileForm.get('personalDetails.dateOfBirth')?.valueChanges.subscribe((dob) => {
      this.updateAge(dob);
    });

  }
onSubmit(): void {
  if (!this.profileForm.valid) {
    this.snackBar.open('Please fill all required fields correctly!', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',  // moves it to the top-center
      panelClass: ['snackbar-error']
    });
    this.logInvalidControls(this.profileForm);
    return;
  }

  this.userProfile = { ...this.profileForm.value };
  this.profile.updateUserProfile(this.userProfile).subscribe({
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
}

  // onSubmit(): void {
  //   if (!this.profileForm.valid) {
  //     console.log('Form is invalid. Here are the errors:');
  //     this.logInvalidControls(this.profileForm);
  //     return;
  //   }

  //   this.userProfile = { ...this.profileForm.value };
  //   this.profile.updateUserProfile(this.userProfile).subscribe({
  //     next: (data) => console.log('Profile updated successfully:', data),
  //     error: (error) => console.error('Error updating profile:', error),
  //     complete: () => console.log('User Profile Updated!')
  //   });
  // }

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

  // onProfilePicturesSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files) {
  //     const selectedFiles = Array.from(input.files);

  //     if (selectedFiles.length > 3) {
  //       alert('You can upload a maximum of 3 images.');
  //       input.value = '';
  //       return;
  //     }

  //     this.profilePictures = selectedFiles;
  //   }
  // }

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
    }
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
    const uploadObservables = this.profilePictures.map(file =>
      this.profile.uploadImage(file)
    );

    forkJoin(uploadObservables).subscribe({
      next: (filenames: string[]) => {
        this.uploadedImageNames = filenames;
        this.uploadedImages = filenames;

        this.profileForm.get('photoDetails')?.patchValue({
          profilePicture: filenames
        });

        alert('Images uploaded successfully!');
      },
      error: (err: any) => {
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

    this.profile.uploadImage(this.familyPicture).subscribe({
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
  }

  deleteImage(imageUrl: string, imgtype: string): void {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    this.profile.deleteImage(fileName,imgtype).subscribe({
      next: () => {
        this.uploadedImages = this.uploadedImages.filter(img => img !== imageUrl);
      },
      error: (err: any) => {
        console.error('Failed to delete image:', err);
      }
    });
  }

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

  // Dropdown options accessors
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

   onDistrictChange(): void {
    const selectedDistrict = this.profileForm.get('familyDetails.nativeDistrict')?.value;

    const district = this.maharashtraData.districts.find(d => d.name === selectedDistrict);
    this.talukas = district ? district.talukas : [];

    // Reset the taluka field
    this.profileForm.get('familyDetails.nativeTaluka')?.reset();

    console.log("Selected District:", selectedDistrict);
    console.log("Updated Talukas:", this.talukas);
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

}