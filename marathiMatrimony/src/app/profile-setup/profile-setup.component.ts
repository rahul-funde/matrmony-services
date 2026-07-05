import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule],
  providers: [  ],
  templateUrl: './profile-setup.component.html',
  styleUrls: ['./profile-setup.component.css']
})
export class ProfileSetupComponent implements OnInit {
  userProfile$: any; // 👈 declare it first

  constructor(private profile: ProfileService) {
      this.userProfile$ = this.profile.getUserProfile();
 }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
  }

 

  onSubmit(): void {
  }

}
