import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  EventEmitter,
  Output
} from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { AuthService } from '../services/auth.service';
import { MaterialModule } from '../material.module';
import { User } from '../models/auth.model';
import { VerifyOtpComponent } from '../verify-otp/verify-otp.component';

import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    RouterModule
  ]
})
export class RegisterComponent implements OnInit, AfterViewInit {

  dob = new Date();
  registerForm!: FormGroup;
  showRegister: boolean = true;
  @Output()
    registerClosed = new EventEmitter<{
      fromRegister: boolean;
      success: boolean;
      intent?: 'login' | 'register';
    }>();

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
    { value: 'Female', label: 'Female' }
  ];
  currentLang: 'मराठी' | 'English' = 'मराठी'; // default Marathi

  terms = [
  {
    mar: 'नावनोंदणी फक्त मराठा समाजातील शिक्षित व उच्चशिक्षित विवाह इच्छुक वधू-वरांसाठीच केली जाईल.',
    en: 'Registration will be accepted only for educated and well-qualified marriage-seeking brides and grooms belonging to the Maratha community.'
  },
  {
    mar: 'विवाह निश्चित झाल्यानंतर संस्थेला कोणतीही अतिरिक्त फी किंवा देणगी देणे आवश्यक नाही.',
    en: 'Once a marriage is finalized, no additional fees or donations are required to be paid to the institution.'
  },
  {
    mar: 'वेबसाईटवरील Search सुविधेद्वारे वय, शिक्षण, नोकरी, व्यवसायाचे ठिकाण, मूळ गाव इत्यादी निकषांवर स्थळे शोधण्याची मोफत सुविधा उपलब्ध आहे.',
    en: 'The website provides a free Search facility to find profiles based on criteria such as age, education, profession, place of work/business, native place, etc.'
  },
  {
    mar: 'नावनोंदणी झाल्यानंतर वधू-वरांचा फोटो व बायोडाटा वेबसाईटवर अपलोड केला जातो व त्यांना एक स्वतंत्र Profile ID दिला जातो.',
    en: 'After registration, the bride/groom’s photograph and biodata are uploaded on the website and a unique Profile ID is assigned.'
  },
  {
    mar: 'अर्जदाराने दिलेली सर्व माहिती खरी व अचूक असणे आवश्यक आहे. चुकीची माहिती दिल्यास त्याची संपूर्ण नैतिक व कायदेशीर जबाबदारी अर्जदाराची राहील.',
    en: 'All information provided by the applicant must be true and accurate. Any false information will be the sole moral and legal responsibility of the registrant.'
  },
  {
    mar: 'पसंतीच्या स्थळांची खातरजमा सदस्यांनी स्वतः, नातेवाईक किंवा मित्रांच्या मदतीने करून घ्यावी. संस्थेची जबाबदारी मर्यादित आहे.',
    en: 'Verification of preferred profiles must be done by the members themselves, with the help of relatives or friends. The institution’s responsibility is limited.'
  },
  {
    mar: 'वेबसाईटवर कमाल ३ फोटो ठेवण्याची/बदलण्याची तसेच प्रोफाइलमधील माहिती अद्ययावत करण्याची मोफत सुविधा उपलब्ध आहे.',
    en: 'The website provides a free facility to upload/change up to 3 photographs and to update profile information.'
  },
  {
    mar: 'नावनोंदणी केल्यानंतर विवाह निश्चित होईलच याची कोणतीही हमी दिली जात नाही. विवाह जुळणे हा योगायोग आहे.',
    en: 'Registration does not guarantee that a marriage will be finalized. Matchmaking depends on mutual compatibility and circumstances.'
  },
  {
    mar: 'विवाह निश्चित झाल्यास सदस्यांनी त्वरित ई-मेल किंवा फोनद्वारे संस्थेला कळवणे बंधनकारक आहे. त्यानंतर कार्यालयातून फोटो व बायोडाटा परत घेणे आवश्यक आहे.',
    en: 'Once a marriage is finalized, members must immediately inform the institution via email or phone. Thereafter, photographs and biodata must be withdrawn from the office.'
  },
  {
    mar: 'केंद्रातील माहितीचा गैरवापर झाल्यास संबंधित सदस्यत्व त्वरित रद्द केले जाईल.',
    en: 'Any misuse of the information provided by the center will result in immediate cancellation of the concerned membership.'
  },
  {
    mar: 'संस्थेमार्फत ई-मेल, व्हॉट्सअ‍ॅप ग्रुप, संदेश इत्यादी माध्यमांतून स्थळांची माहिती दिली जाऊ शकते.',
    en: 'The institution may share profile information through email, WhatsApp groups, messages, or similar communication channels.'
  },
  {
    mar: 'नोंदणीकृत सदस्यांना वधू-वरांचे संपर्क क्रमांक प्रोफाइलच्या शेवटी पाहता येतील. यासाठी युजर ID व पासवर्ड वापरून लॉगिन करणे आवश्यक आहे.',
    en: 'Registered members can view contact numbers of brides and grooms at the end of the profile. Login using a User ID and password is mandatory.'
  },
  {
    mar: 'पत्रिका, देवक, गोत्र, नाडी किंवा रक्तगट यावरून स्थळ नाकारणे वैज्ञानिकदृष्ट्या योग्य नाही. प्रत्यक्ष गुणधर्मांना अधिक महत्त्व द्यावे.',
    en: 'Rejecting profiles based on horoscope, Devak, Gotra, Nadi, or blood group is not scientifically valid. Greater importance should be given to personal qualities.'
  },
  {
    mar: 'पालकांनी बायोडाटा पाहून शैक्षणिक पात्रता, आर्थिक स्थिती, शारीरिक अनुरूपता व अपेक्षा लक्षात घेऊन स्थळ निवडावे.',
    en: 'Parents should select profiles by carefully reviewing educational qualifications, financial status, physical compatibility, and expectations mentioned in the biodata.'
  },
  {
    mar: 'वेबसाईटवरील सर्व स्थळांची माहिती मोफत व कोणत्याही वेळी पाहता येते.',
    en: 'All profiles available on the website can be viewed free of charge at any time.'
  },
  {
    mar: 'सदस्यांना त्यांच्या निवडलेल्या प्लॅननुसार दर ७ दिवसांत बायोडाटे दिले जातील, ज्यामध्ये संपर्क क्रमांक, नाव, पालकांचे नाव, ई-मेल व पत्ता यांचा समावेश असेल.',
    en: 'As per the selected plan, members will receive biodata every 7 days, including contact numbers, name, parents’ names, email ID, and address.'
  },
  {
    mar: 'पसंतीच्या स्थळांशी संपर्क साधणे व पुढील बोलणी करणे ही संपूर्णपणे सदस्यांची जबाबदारी आहे. संस्था फक्त बायोडाटा पुरवते.',
    en: 'Contacting preferred profiles and carrying forward discussions is entirely the responsibility of the members. The institution only provides biodata.'
  },
  {
    mar: 'फी फक्त UPI पेमेंट माध्यमांतून भरता येईल. वेबसाईटवरील Online Payment पर्यायाचा वापर करावा.',
    en: 'Fees can be paid only through UPI payment modes. Members must use the Online Payment option available on the website.'
  },
  {
    mar: 'तांत्रिक कारणांमुळे सेवा खंडित झाल्यास त्याबाबत संस्थेची कोणतीही कायदेशीर जबाबदारी राहणार नाही.',
    en: 'The institution shall not be legally responsible for service interruptions caused due to technical issues.'
  },
  {
    mar: 'एकदा भरलेली फी कोणत्याही परिस्थितीत परत मिळणार नाही.',
    en: 'Once paid, the registration fee is non-refundable under any circumstances.'
  },
  {
    mar: 'नावनोंदणी करण्यापूर्वी वेबसाईटवर उपलब्ध स्थळे पाहून खात्री करावी. नंतर कोणतीही तक्रार ग्राह्य धरली जाणार नाही.',
    en: 'Members should review the available profiles on the website before registering. No complaints will be entertained thereafter.'
  },
  {
    mar: 'बायोडाटामधील माहितीची अचूकता तपासण्याची संपूर्ण जबाबदारी सदस्यांची आहे.',
    en: 'Verifying the accuracy of the information mentioned in the biodata is solely the responsibility of the members.'
  },
  {
    mar: 'अत्याधुनिक तंत्रज्ञानाच्या साहाय्याने कार्यरत असलेल्या या केंद्राद्वारे सदस्यांना मराठा समाजातील अधिकाधिक स्थळांपर्यंत पोहोचण्याची सुविधा दिली जाते.',
    en: 'By using advanced technology, the center enables members to connect with a larger number of Maratha community profiles.'
  },
  {
    mar: 'सर्व नियम व अटींचे सविस्तर विवरण वेबसाईटवरील TERMS या लिंकवर उपलब्ध आहे.',
    en: 'Detailed Terms & Conditions are available on the website under the TERMS link.'
  },
  {
    mar: 'वरील सर्व नियम व अटी मान्य असल्यासच नावनोंदणी करावी.',
    en: 'Registration should be done only after agreeing to all the above Terms & Conditions.'
  },
  {
    mar: 'बनावट किंवा फसव्या प्रोफाइलची नोंदणी टाळण्यासाठी आधार तपशील, मोबाईल क्रमांक व ई-मेल आयडी फक्त ओळख पडताळणी व प्रमाणीकरणासाठीच गोळा केले जातात. ही वैयक्तिक माहिती कोणत्याही अन्य कारणासाठी वापरली जात नाही तसेच लागू असलेल्या माहिती संरक्षण कायद्यांनुसार ती कोणालाही शेअर, विक्री किंवा हस्तांतरित केली जात नाही.',
    en: 'Aadhar details, mobile numbers, and email IDs are collected solely for verification and authentication to prevent fraudulent or fake profile registrations. Such personal data is not shared, sold, or used for any purpose other than verification, in accordance with applicable data protection laws.'
  }
];

  constructor(
    private fb: FormBuilder,
    private registerService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {

     // Get the language from sessionStorage (set by another component)
      const savedLang = sessionStorage.getItem('currentLang');
      if (savedLang === 'मराठी' || savedLang === 'English') {
        this.currentLang = savedLang;
      }

    this.registerForm = this.fb.group(
      {
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        gender: ['', Validators.required],
        dob: ['', [Validators.required, this.ageValidator.bind(this)]],
        mobilenumber: [
          '',
          [Validators.required, Validators.pattern('^[0-9]{10}$')]
        ],
        email: ['', [Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        termsAccepted: [false, Validators.requiredTrue]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  /* ---------------- PASSWORD MATCH VALIDATOR ---------------- */
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.scrollToFirstError();
      return;
    }

    const userData: User = this.registerForm.value;

    this.registerService.register(userData).subscribe({
      next: (response) => {
        localStorage.setItem('pendingUserId', response.user.userId);
        sessionStorage.setItem('pendingOtp', response.user.otp.toString());

        this.snackBar.open(
          response.message || 'Registration successful',
          'Close',
          { duration: 4000 }
        );

        this.registerForm.reset();
        this.closeDialog();

         
        // ✅ Close dialog without emitting
        this.showRegister = false;

        // ✅ Emit success = true
        this.registerClosed.emit({ fromRegister: true, success: true });
        
        const dialogRef = this.dialog.open(VerifyOtpComponent, {
          width: '400px',
          disableClose: true, // prevents closing by clicking outside
          data: { userId: response.user.userId } // pass any data if needed
        });

        // Optional: listen to dialog close
        dialogRef.afterClosed().subscribe((result) => {
          console.log('OTP dialog closed', result);
          // You can handle post-close actions here if needed
        });


        //this.router.navigate(['/verify-otp']);
      },
      error: (error) => {
        this.snackBar.open(
          error?.error?.message || 'Registration failed.',
          'Close',
          { duration: 4000 }
        );
      
      this.showRegister = false;

      // ✅ Emit success = false
      this.registerClosed.emit({ fromRegister: true, success: false });
        this.closeDialog();
      }
    });
  }

  /* ---------------- AGE VALIDATOR ---------------- */
  ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const dob = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const gender = this.registerForm?.get('gender')?.value;

    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() &&
        today.getDate() < dob.getDate())
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
    this.cdr.detectChanges();
  }

  /* ---------------- CLOSE DIALOG ---------------- */
  closeDialogx(event?: Event): void {
    if (event) event.stopPropagation();
    this.showRegister = false;
    // this.registerClosed.emit({ fromRegister: true, success: false });

    document
      .querySelectorAll('.cdk-overlay-backdrop')
      .forEach((b) => ((b as HTMLElement).style.display = 'none'));
  }

  closeDialog(event?: Event): void {
    if (event) event.stopPropagation();
    this.showRegister = false;
   // this.registerClosed.emit();
    // this.registerClosed.emit({ fromRegister: true, success: false });

    document
      .querySelectorAll('.cdk-overlay-backdrop')
      .forEach((b) => ((b as HTMLElement).style.display = 'none'));
  }

  /* ---------------- SCROLL TO FIRST ERROR ---------------- */
  scrollToFirstError() {
    setTimeout(() => {
      const firstError = document.querySelector(
        '.floating-control.ng-invalid'
      ) as HTMLElement;

      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
    }, 100);
  }

  isInvalid(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  showTermsDialog = false;
  openTerms(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showTermsDialog = true;
  }

  closeTerms() {
    this.showTermsDialog = false;
  }

  agreeTerms(){
    this.registerForm.get('termsAccepted')?.setValue(true);
    this.showTermsDialog = false;
  }

  goToLogin(event?: Event): void {
    if (event) event.stopPropagation();

    this.closeDialog();

    // ✅ tell parent this is intentional login
    this.registerClosed.emit({
      fromRegister: true,
      success: false,
      intent: 'login'
    });
  }

}
