import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../services-blue/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatButtonModule, FormsModule],
  providers: [UserService]
})
export class ProfileSummaryComponent implements OnInit {
  user: any = {};
  stats: any = {};

  constructor(private userService: UserService) {}
  ngOnInit() {
    this.userService.getUser().subscribe(u => this.user = u);
    this.userService.getProfileStats().subscribe(s => this.stats = s);
  }
}
