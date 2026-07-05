import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    HttpClientModule,
  ],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css'],
})
export class VerifyOtpComponent {
  otpForm: FormGroup;
  isLoading = false;
  message: string = ''; // Inline message
  currentLang: 'मराठी' | 'English' = 'मराठी'; // default Marathi
  userId: any = '';
  otp: any = ""
  showResendOption = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialogRef: MatDialogRef<VerifyOtpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string; otp?: string }
  ) {
    this.otpForm = this.fb.group({
      otp: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
    });
  }

  ngOnInit() {

    this.userId = sessionStorage.getItem('pendingUserId');
    this.otp = sessionStorage.getItem('pendingOtp');

     // Get the language from sessionStorage (set by another component)
      const savedLang = sessionStorage.getItem('currentLang');
      if (savedLang === 'मराठी' || savedLang === 'English') {
        this.currentLang = savedLang;
      }
    if (!this.data?.userId) {
      this.snackBar.open('Missing user information. Please register again.', 'Close', { duration: 4000 });
      this.closeDialog(false);
    }
  }

  // ✅ Getter for form controls (use bracket notation in template)
  get f() {
    return this.otpForm.controls;
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.verifyOtp(this.data.userId, this.f['otp'].value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = res.message || 'OTP verified successfully';
        this.snackBar.open(this.message, 'Close', { duration: 3000 });
          this.closeDialog(true);

        if (res.message === 'OTP verified successfully') {
          this.closeDialog(true);
          this.router.navigate(['/welcome'], { queryParams: { showLogin: 'true' } });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err.error?.message || 'Something went wrong';
        this.snackBar.open(this.message, 'Close', { duration: 4000 });

        if (this.message === 'OTP expired') {
          this.showResendOption = true;
        }
      },
    });
  }

  resendOtp(): void {
    if (!this.data?.userId) return;

    this.isLoading = true;

    this.authService.resendOtp(this.data.userId).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = res.message || 'OTP resent successfully';
        this.snackBar.open(this.message, 'Close', { duration: 3000 });
        this.showResendOption = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.message = err.error?.message || 'Failed to resend OTP';
        this.snackBar.open(this.message, 'Close', { duration: 3000 });
      },
    });
  }

  closeDialog(success: boolean = false): void {
    this.dialogRef.close({ success });
  }
}
