import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';
import { User } from '../models/auth.model';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    CarouselModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
  ],
})
export class RegisterComponent implements OnInit, AfterViewInit  {
  dob = new Date();
  registerForm!: FormGroup;
  

  customOptions: OwlOptions = {
    loop: true,
    margin: 10,
    nav: true,
    dots: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    items: 1
  };
    

  slides = [
  { id: '1', image: '/images/banner-1.jpg', title: 'Slide 1' },
  { id: '2', image: '/images/banner-ad-1.jpg', title: 'Slide 2' },
  { id: '3', image: '/images/banner-ad-2.jpg', title: 'Slide 3' },
  { id: '4', image: '/images/banner-newsletter.jpg', title: 'Slide 4' }
];

  genders = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
  ];


  constructor(private fb: FormBuilder, private registerService: AuthService, private cdr: ChangeDetectorRef,private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        gender: ['', Validators.required],
        dob: ['', [Validators.required, this.ageValidator.bind(this)]],
        mobilenumber: [
          '',
          [Validators.required, Validators.pattern('^[0-9]{10}$')],
        ],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // Password match validator for entire form group
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const userData: User = this.registerForm.value;

      this.registerService.register(userData).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          alert('Registration successful! Redirecting to login...');
          this.registerForm.reset();
          // Optionally redirect
          this.router.navigate(['/welcome']);
        },
        error: (error) => {
          console.error('Error occurred:', error);
          alert('Registration failed');
        },
      });
    } else {
      alert('Please fix the errors before submitting.');
    }
  }

  // Age validator that depends on gender value
  ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null; // don't validate empty date here; required validator does that

    const dob = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const gender = this.registerForm?.get('gender')?.value;

    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    if (gender === 'Male' && age < 21) {
      return { ageInvalid: 'पुरुषासाठी किमान वय 21 वर्षे असावे.' };
    }

    if (gender === 'Female' && age < 18) {
      return { ageInvalid: 'स्त्रीसाठी किमान वय 18 वर्षे असावे.' };
    }

    return null;
  }

  // Call this when gender changes to revalidate DOB
  onGenderChange() {
    this.registerForm.get('dob')?.updateValueAndValidity();
  }

  get f() {
    return this.registerForm.controls;
  }

  updateDob(event: any) {
    this.dob = event.target.valueAsDate || new Date(event.target.value);
  }

  ngAfterViewInit(): void {
    // Force change detection after view initialization
    this.cdr.detectChanges();
  }
}
