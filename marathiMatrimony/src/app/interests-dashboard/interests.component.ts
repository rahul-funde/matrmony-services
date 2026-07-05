import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Subscription } from 'rxjs';

import { InterestService } from '../services/interest.service';
import { Interest, InterestResponse, ProfilePicture } from '../models/interest';
import { SidenavService } from '../services/sidenav.service';
import { MaterialModule } from '../material.module';
import { environment } from '../../environments/environment';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

@Component({
  selector: 'app-interests',
  standalone: true,
  templateUrl: './interests.component.html',
  styleUrls: ['./interests.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    InfiniteScrollModule,
    MaterialModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    ImageViewerComponent,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'mr-IN' }],
})
export class InterestsComponent implements OnInit, AfterViewInit, OnDestroy {
  /* ───────────────── Tabs ───────────────── */
  tabs: Array<'sent' | 'received' | 'accepted' | 'rejected'> = [
    'sent',
    'received',
    'accepted',
    'rejected',
  ];
  selectedTab: 'sent' | 'received' | 'accepted' | 'rejected' = 'sent';
  selectedIndex = 0;

  /* ───────────────── Data ───────────────── */
  displayedInterests: Interest[] = [];
  private interestsSubscription?: Subscription;
  private subscriptions: Subscription[] = [];
  private latestInterestData: InterestResponse | null = null;

  pageSize = 8;
  currentPage = 1;

  apiUrl = environment.apiUrl;

  /* ───────────────── Sidenav ───────────────── */
  @ViewChild('sidenav') sidenav: any;
  private toggleSubscription?: Subscription;

  /* ───────────────── Viewer ───────────────── */
  viewerOpen = false;
  selectedImages: string[] = [];
  currentUserId!: string;

  constructor(
    private interestService: InterestService,
    private sidenavService: SidenavService,
    private snackBar: MatSnackBar
  ) {}

  /* ───────────────── Lifecycle ───────────────── */
  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    this.interestService.loadInterests();

    // Subscribe to interests observable once
    this.interestsSubscription = this.interestService.interests$.subscribe(
      (data: InterestResponse) => {
        this.latestInterestData = data; // cache latest data
        this.updateDisplayedInterests();
      }
    );

  }

private getCurrentUserId(): string {
  try {
    const data = sessionStorage.getItem('userData');
    if (!data) return '';

    const parsed = JSON.parse(data);
    return parsed?.userId || '';
  } catch (error) {
    console.error('Invalid session userData');
    return '';
  }
}


  ngAfterViewInit(): void {
    this.toggleSubscription = this.sidenavService.toggle$?.subscribe(() =>
      this.sidenav?.toggle()
    );
  }

  ngOnDestroy(): void {
    this.toggleSubscription?.unsubscribe();
    this.interestsSubscription?.unsubscribe();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /* ───────────────── Tab Change ───────────────── */
  onTabChange(index: number): void {
    this.selectedIndex = index;
    this.selectedTab = this.tabs[index];
    this.currentPage = 1;
    this.updateDisplayedInterests();
  }

  /* ───────────────── Infinite Scroll ───────────────── */
  onScroll(): void {
    this.currentPage++;
    this.updateDisplayedInterests();
  }

  private updateDisplayedInterests(): void {
    if (!this.latestInterestData) return;

    const list = this.latestInterestData[this.selectedTab] || [];
    this.displayedInterests = list.slice(0, this.currentPage * this.pageSize);
  }

  /* ───────────────── Actions ───────────────── */
  acceptInterest(interestId: string): void {
    this.changeStatus(interestId, 'accepted', 'Request accepted 💖');
  }

  rejectInterest(interestId: string): void {
    this.changeStatus(interestId, 'rejected', 'Request rejected ❌');
  }

  unsendInterest(interestId: string): void {
    const sub = this.interestService.withdrawInterest(interestId).subscribe({
      next: (success) => {
        if (success) {
          this.displayedInterests = this.displayedInterests.filter(
            (i) => i.interestId !== interestId
          );
          this.snackBar.open('Interest cancelled.', 'Close', { duration: 2500 });
        }
      },
    });
    this.subscriptions.push(sub);
  }

  cancelInterest(interestId: string): void {
    if (!confirm('Are you sure you want to cancel this interest?')) return;

    const sub = this.interestService.withdrawInterest(interestId).subscribe({
      next: () => {
        this.displayedInterests = this.displayedInterests.filter(
          (i) => i.interestId !== interestId
        );
        this.snackBar.open('Interest cancelled.', 'Close', { duration: 2500 });
      },
      error: (err) => console.error('Cancel failed', err),
    });
    this.subscriptions.push(sub);
  }

  private changeStatus(
    interestId: string,
    status: 'accepted' | 'rejected',
    message: string
  ): void {
    const sub = this.interestService
      .updateInterestStatus(interestId, status)
      .subscribe({
        next: (success) => {
          if (success) {
            const index = this.displayedInterests.findIndex(
              (i) => i.interestId === interestId
            );
            if (index !== -1) this.displayedInterests[index].status = status;
            this.snackBar.open(message, 'Close', { duration: 2500 });
          }
        },
        error: (err) => console.error(err),
      });
    this.subscriptions.push(sub);
  }

  /* ───────────────── Image Helpers ───────────────── */
  getProfileImage(data: any): string {
    if (!data?.profilePicture?.length) return 'images/avatar.png';
    const profileImg = data.profilePicture.find((img: any) => img?.isProfile === true);
    if (profileImg)
      return this.apiUrl + (profileImg.thumbUrl || profileImg.originalUrl);
    return this.apiUrl + (data.profilePicture[0].thumbUrl || data.profilePicture[0].originalUrl);
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'images/avatar.png';
  }

  openViewer(pictures: ProfilePicture[] | undefined): void {
    if (!pictures || pictures.length === 0) return;
    this.selectedImages = pictures.map((pic) => this.apiUrl + (pic.originalUrl || pic.thumbUrl));
    this.viewerOpen = true;
  }

  /* ───────────────── Swipe Support ───────────────── */
  private touchStartX = 0;
  private touchEndX = 0;

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent, interest: Interest): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe(interest);
  }

  private handleSwipe(interest: Interest): void {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (swipeDistance < -80) this.handleLeftSwipe(interest);
    if (swipeDistance > 80) this.handleRightSwipe(interest);
  }

  private handleLeftSwipe(interest: Interest): void {
    if (this.selectedTab === 'received' && interest.status === 'pending') {
      this.rejectInterest(interest.interestId);
    }
    if (this.selectedTab === 'sent' && interest.status === 'pending') {
      this.unsendInterest(interest.interestId);
    }
  }

  private handleRightSwipe(interest: Interest): void {
    if (this.selectedTab === 'received' && interest.status === 'pending') {
      this.acceptInterest(interest.interestId);
    }
  }
}
