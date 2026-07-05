import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  @Output() forgotClosed = new EventEmitter<{
      fromRegister: boolean;
      success: boolean;
      intent?: 'login' | 'register';
    }>();

  constructor(private fb: FormBuilder, private authService: AuthService, private route: ActivatedRoute, private router: Router) {
    this.forgotForm = this.fb.group({
      contact: ['', [this.emailOrPhoneValidator.bind(this)]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Use AuthService instead of HttpClient directly
    this.authService.forgotPassword(this.forgotForm.value.contact).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message; //'Reset link sent! Check your email.';
            // Redirect after short delay
        setTimeout(() => this.router.navigate(['/welcome']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error.message || 'Something went wrong.';
      }
    });
  }

    // ✅ Function to navigate programmatically
  navigateToLogin(): void {
    this.router.navigate(['/welcome']);   // or ['/login'] if your route is named that
  }

  /* ---------------- CLOSE DIALOG ---------------- */
  closeDialogx(event?: Event): void {
    if (event) event.stopPropagation();
    this.forgotClosed.emit({ fromRegister: true, success: false });

    document
      .querySelectorAll('.cdk-overlay-backdrop')
      .forEach((b) => ((b as HTMLElement).style.display = 'none'));
  }

  goToLogin(event?: Event): void {
    if (event) event.stopPropagation();

    this.closeDialogx();

    // ✅ tell parent this is intentional login
    this.forgotClosed.emit({
      fromRegister: true,
      success: false,
      intent: 'login'
    });
  }


  // Custom validator
  emailOrPhoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) return { required: true }; // Required check

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Simple phone regex (10 digits, optional country code)
    const phoneRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;

    if (emailRegex.test(value) || phoneRegex.test(value)) {
      return null; // valid
    }

    return { invalidContact: true }; // invalid
  }
}
