import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';
import { RouterModule } from '@angular/router';
import { LoginRequest } from '../models/auth.model';


@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, MaterialModule, RouterModule]
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]], // Accepts email or mobile
      password: ['', [Validators.required]]
    });
  }

  login() {
    if (this.loginForm.valid) {
      const loginData: LoginRequest = this.loginForm.value; // Ensure it follows the User model
      this.authService.login(loginData).subscribe((res) => {
        // localStorage.setItem('token', res.token);
        // this.router.navigate(['/dashboard']);
        this.router.navigate(['/user-profile']);
      });
    }
  }
}
