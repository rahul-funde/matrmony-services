import { Component } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLogin } from '../models/admin-login';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-login',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private adminAuth: AdminAuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }
  
  onSubmit() {
    if (this.loginForm.invalid) return;
  
    const loginData: AdminLogin = this.loginForm.value;
  
    this.adminAuth.loginAdmin(loginData).subscribe({
      next: (res) => {
        this.adminAuth.storeToken(res.token);
        this.router.navigate(['/admin-dashboard']);
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Login failed', 'Close', { duration: 3000 });
      }
    });
  }
}
