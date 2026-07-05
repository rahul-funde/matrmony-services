import { 
  AfterViewInit, 
  ChangeDetectorRef, 
  Component, 
  OnInit, 
  ViewChild, 
  TemplateRef,
  EventEmitter,
  Output 
} from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../environments/environment'

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [ 
    CommonModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent implements OnInit, AfterViewInit {

  constructor(
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router,
    private http: HttpClient
  ) {}

  // ================= EXISTING =================
  currentLang: 'मराठी' | 'English' = 'मराठी';
  @Output() contactUsClose = new EventEmitter<void>();

  closeDialog(): void {
    this.contactUsClose.emit();
  }



  // ================= ADDED =================
  contactForm!: FormGroup;
  loading = false;

  apiUrl = environment.apiUrl ;

  ngOnInit(): void {
    // Language from session
    const savedLang = sessionStorage.getItem('currentLang');
    if (savedLang === 'मराठी' || savedLang === 'English') {
      this.currentLang = savedLang;
    }

    // Form init
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      language: [this.currentLang]
    });
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }
  isContactOpen = true; // open modal
  successMsg: string = '';
  errorMsg: string = '';
  // ================= SUBMIT =================
  submitForm(): void {
    if (this.contactForm.invalid) return;

    this.loading = true;

    this.http.post<any>(`${this.apiUrl}/api/landingPage/contactUs`, this.contactForm.value).subscribe({
      next: () => {
        alert(
          this.currentLang === 'मराठी'
            ? 'आपला संदेश यशस्वीपणे पाठवण्यात आला आहे'
            : 'Your message has been sent successfully'
        );

        this.contactForm.reset({ language: this.currentLang });
        this.loading = false;
      },
      error: () => {
        alert(
          this.currentLang === 'मराठी'
            ? 'काहीतरी चूक झाली, कृपया पुन्हा प्रयत्न करा'
            : 'Something went wrong, please try again'
        );
        this.loading = false;
      }
    });
  }
}
