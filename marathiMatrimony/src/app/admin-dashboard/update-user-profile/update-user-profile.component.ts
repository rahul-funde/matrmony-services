import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './../../material.module';
import { RouterModule } from '@angular/router';
import { AdminUserDataService } from '../../services/admin-user-data.service';
import { UserProfile } from '../../models/user-profile';
import { AgeCalPipe } from '../../pipes/age-cal.pipe';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-update-user-profile',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterModule,
    AgeCalPipe
],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'mr-IN' }
  ],
  templateUrl: './update-user-profile.component.html',
  styleUrl: './update-user-profile.component.css'
})
export class UpdateUserProfileComponent  implements OnInit, AfterViewInit, OnDestroy  {
  userId: string | null = null;
  profileForm!: FormGroup;
  userProfile: UserProfile;
  profileOptions: any = {};
  value: number = 0;
  unit: string = 'feet';

  constructor( private route: ActivatedRoute, private fb: FormBuilder, private profile: AdminUserDataService) {
    this.userProfile = new UserProfile();
    this.userId = this.route.snapshot.paramMap.get('id');
  }
  ngAfterViewInit(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    this.initForm();
    this.profile.getProfileOptions().subscribe((data:any) => {
      this.profileOptions = data;
    });

    this.profile.getUserProfile().subscribe({
      next: (data) => {
        this.profileForm.patchValue(data);
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
      },
      complete: () => {
        console.log('User Profile Completed!');
      }
    });
  }


  ngOnDestroy(): void {
  }

  private initForm() {
    this.profileForm = this.fb.group({
      personalDetails: this.fb.group({
        firstName: ['', Validators.required],
        middleName: ['', Validators.required],
        lastName: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        age: ['0', Validators.required],
        gender: ['', Validators.required],
        religion: ['', Validators.required],
        caste: ['', Validators.required],
        subCaste: ['', Validators.required],
        maritalStatus: ['', Validators.required],
        height: [{ value: '', disabled: false }],
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
        profilePicture: [null, Validators.required],
        familyPicture: [null]
      }),
      additionalInfoDetails: this.fb.group({
        personalDescription: ['', [Validators.required, Validators.maxLength(1000)]],
        reasonForPartner: ['', [Validators.required, Validators.maxLength(1000)]],
        partnerExpectations: ['', [Validators.required, Validators.maxLength(1000)]]
      })
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.userProfile = { ...this.profileForm.value };
      this.profile.updateUserProfile(this.userProfile).subscribe({
        next: (data) => {
          console.log('Profile updated successfully:', data);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
        },
        complete: () => {
          console.log('User Profile Updated!');
        }
      });
    }
  }

  onFileSelected(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      const control = this.profileForm.get(controlName);
      if (control) {
        control.setValue(file);
        control.updateValueAndValidity();
      }
    }
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

  get subCasteOptions() {
    return Object.values(this.profileOptions.subCaste || {});
  }

  get maritalStatusOptions() {
    return Object.values(this.profileOptions.maritalStatus || {});
  }

  get complexionOptions() {
    return Object.values(this.profileOptions.complexion || {});
  }

  get bloodGroupOptions() {
    return Object.values(this.profileOptions.bloodGroup || {});
  }

  get dietOptions() {
    return Object.values(this.profileOptions.diet || {});
  }

  get rashiOptions() {
    return Object.values(this.profileOptions.rashi || {});
  }

  get nakshatraOptions() {
    return Object.values(this.profileOptions.nakshatra || {});
  }

  get charanOptions() {
    return Object.values(this.profileOptions.charan || {});
  }

  get nadiOptions() {
    return Object.values(this.profileOptions.nadi || {});
  }

  get ganOptions() {
    return Object.values(this.profileOptions.gan || {});
  }

  get mangalOptions() {
    return Object.values(this.profileOptions.mangal || {});
  }

}
