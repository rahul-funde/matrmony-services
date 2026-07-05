import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { RecommendationsComponent } from '../recommendations/recommendations.component';
import { ProfileSummaryComponent } from '../dashboardNew/profile-summary/profile-summary.component';
import { InterestsComponent } from '../interests-dashboard/interests.component';

@Component({
  selector: 'app-home-container',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    RecommendationsComponent,
    ProfileSummaryComponent,
    InterestsComponent
  ],
  templateUrl: './home-container.component.html',
  styleUrl: './home-container.component.css'
})
export class HomeContainerComponent implements OnInit {
  userName = 'Santosh';
  profileCompletion = 75;
  gridCols = 4;

  recommendations = [];

  heroStats = [
    { value: '12', label: 'New profiles today', hint: 'Fresh suggestions for you' },
    { value: '3', label: 'Interests waiting', hint: 'People want to connect' },
    { value: '75%', label: 'Profile ready', hint: 'A few small updates can help' }
  ];

  nextSteps = [
    { icon: '📷', title: 'Add a clear photo', description: 'A friendly photo helps people feel more comfortable reaching out.' },
    { icon: '💬', title: 'Send a simple hello', description: 'A short, kind message often works better than a long one.' },
    { icon: '🛡️', title: 'Keep your details updated', description: 'Current details build trust and make the experience smoother.' }
  ];

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  messages = [
    { name: 'John Gauer', message: 'Adiantа, GA', time: '13 min ago', unread: true },
    { name: 'Andrey Chan', message: 'Amhere fead', time: '14 h ago', unread: false },
    { name: 'Andrey Nun', message: 'Good news and some extra content that is too long to fit', time: '23 h ago', unread: true },
    { name: 'Jonathan Frase', message: 'Gheckad', time: '48 h ago', unread: false }
  ];

  constructor() {}

  ngOnInit(): void {
    const storedUser = sessionStorage.getItem('userData');
    if (!storedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      this.userName = parsedUser?.name || parsedUser?.fullName || parsedUser?.firstName || this.userName;
      if (typeof parsedUser?.profileCompletion === 'number') {
        this.profileCompletion = Math.max(0, Math.min(100, parsedUser.profileCompletion));
      }
    } catch {
      this.userName = this.userName;
    }
  }

  scrollLeft(): void {
    this.scrollContainer.nativeElement.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight(): void {
    this.scrollContainer.nativeElement.scrollBy({ left: 250, behavior: 'smooth' });
  }
}
