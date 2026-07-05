import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from '../material.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule]
})
export class DashboardComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router, private dataService: ProfileService) {}

  ngOnInit() {
    this.user$ = this.dataService.getUserProfile();
  }

  onImageError(event: any) {
    event.target.src = 'images/avatar.png';
  }
  userName: string = "Rahul Funde"
  logout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }
}
