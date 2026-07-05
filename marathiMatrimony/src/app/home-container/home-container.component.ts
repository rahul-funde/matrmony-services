import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { RecommendationsComponent  } from '../recommendations/recommendations.component' ;
import { ProfileSummaryComponent } from '../dashboardNew/profile-summary/profile-summary.component';
import { InterestsComponent  } from '../interests-dashboard/interests.component' ;

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
export class HomeContainerComponent  implements OnInit {
  userName: string = "Santosh"
  profileCompletion: number = 75; // Example: Profile is 75% complete
  gridCols = 4;

recommendations = [];

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  messages = [
    { name: 'John Gauer', message: 'Adiantа, GA', time: '13 min ago', unread: true },
    { name: 'Andrey Chan', message: 'Amhere fead', time: '14 h ago', unread: false },
    { name: 'Andrey Nun', message: 'Good news and some extra content that is too long to fit', time: '23 h ago', unread: true },
    { name: 'Jonathan Frase', message: 'Gheckad', time: '48 h ago', unread: false }
  ];
  

  constructor() {}

  ngOnInit() {
  }

  
  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({ left: 250, behavior: 'smooth' });
  }
}
