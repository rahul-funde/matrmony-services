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
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})

export class AboutUsComponent implements OnInit, AfterViewInit {
  constructor(
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private router: Router
  ) {}
    currentLang: 'मराठी' | 'English' = 'मराठी'; // default Marathi
    featureListEn = [
      '100% Mobile Verified Profiles',
      'Safe, Secure & User-Friendly Platform',
      'View Profiles for Free via Website & WhatsApp',
      'Advanced Search Options',
      'Marathi Printed Biodata'
    ];

    featureListMr = [
      '100% मोबाईल व्हेरिफाइड प्रोफाईल्स',
      'सुरक्षित व वापरण्यास सुलभ प्लॅटफॉर्म',
      'वेबसाईट व व्हॉट्सॲपवर विनामूल्य प्रोफाईल्स',
      'प्रगत शोध सुविधा',
      'छापील मराठी बायोडेटा'
    ];

    specialListEn = [
      'Brides, Grooms, Widows & Divorced categories',
      'Online support to match your expectations'
    ];

    specialListMr = [
      'वधू-वर, विधवा/विधुर व घटस्फोटीतांसाठी स्वतंत्र गट',
      'आपल्या अपेक्षांनुसार वधू-वर शोधण्यासाठी ऑनलाइन सहाय्य'
    ];

    // Corresponding Icons (Unicode/Emoji)
    featureIcons = [
      '📱', // Mobile Verified
      '🔒', // Secure Platform
      '🌐', // Website/WhatsApp
      '🔍', // Advanced Search
      '📄'  // Printed Biodata
    ];

    @Output() aboutUsClose = new EventEmitter<void>();

    closeDialog(): void {
      this.aboutUsClose.emit();
    }
    ngOnInit(): void {
      // Get the language from sessionStorage (set by another component)
      const savedLang = sessionStorage.getItem('currentLang');
      if (savedLang === 'मराठी' || savedLang === 'English') {
        this.currentLang = savedLang;
      }
      // If nothing is saved, default remains Marathi
    }

    ngAfterViewInit(): void {
      this.cdr.detectChanges();
    }

}
