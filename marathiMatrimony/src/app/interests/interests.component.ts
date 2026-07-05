import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { InterestService } from '../services/interest.service';
import { Interest, InterestResponse, ProfilePicture } from '../models/interest';
import { CommonModule } from '@angular/common';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MaterialModule } from '../material.module';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { SidenavMenuService } from '../services/sidenav-menu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InfiniteScrollModule,
    MaterialModule,
    HeaderComponent,
    SidenavComponent,
    FooterComponent
  ],
  templateUrl: './interests.component.html',
  styleUrls: ['./interests.component.css']
})
export class InterestsComponent implements OnInit, OnDestroy {

  tabs: Array<'sent' | 'received' | 'accepted' | 'rejected'> = ['sent','received','accepted','rejected'];
  selectedTab: 'sent' | 'received' | 'accepted' | 'rejected' = 'sent';

  displayedInterests: Interest[] = [];
  pageSize = 8;
  currentPage = 1;
  apiUrl = environment.apiUrl;
  isMobiles = window.innerWidth < 768;

  selectedImages: string[] = [];
  viewerOpen = false;

  private subscription?: Subscription;
  currentUserId!: string;

  constructor(
    public interestService: InterestService,
    public sidenavMenuService: SidenavMenuService
  ) {}

  ngOnInit(): void {

     const userData = sessionStorage.getItem('userData');
      if (userData) {
        this.currentUserId = JSON.parse(userData).userId;
      }
    // Load interests once
    this.interestService.loadInterests();

    // Single subscription for reactive updates
    this.subscription = this.interestService.interests$.subscribe(
      data => this.updateDisplayedInterests(data)
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  switchTab(tab: 'sent' | 'received' | 'accepted' | 'rejected') {
    this.selectedTab = tab;
    this.currentPage = 1;
    this.interestService.interests$.subscribe(data => this.updateDisplayedInterests(data)).unsubscribe();
  }

  onScroll() {
    this.currentPage++;
    this.interestService.interests$.subscribe(data => this.updateDisplayedInterests(data)).unsubscribe();
  }

  private updateDisplayedInterests(data: InterestResponse) {
    const list = data[this.selectedTab] || [];
    this.displayedInterests = list.slice(0, this.currentPage * this.pageSize);
  }

  acceptInterest(interestId: string) {
    this.interestService.updateInterestStatus(interestId, 'accepted').subscribe(success => {
      if (success) this.updateLocalStatus(interestId, 'accepted');
    });
  }

  rejectInterest(interestId: string) {
    this.interestService.updateInterestStatus(interestId, 'rejected').subscribe(success => {
      if (success) this.updateLocalStatus(interestId, 'rejected');
    });
  }

  cancelInterest(interestId: string) {
    if (!confirm('Are you sure you want to cancel this interest?')) return;
    this.interestService.withdrawInterest(interestId).subscribe(success => {
      if (success) this.removeLocalInterest(interestId);
    });
  }

  private updateLocalStatus(interestId: string, status: 'accepted' | 'rejected') {
    const index = this.displayedInterests.findIndex(i => i.interestId === interestId);
    if (index !== -1) this.displayedInterests[index].status = status;
  }

  private removeLocalInterest(interestId: string) {
    this.displayedInterests = this.displayedInterests.filter(i => i.interestId !== interestId);
  }

  getProfileImage(interest: Interest): string {
    if (!interest?.profilePicture?.length) return 'images/avatar.png';
    const profileImg = interest.profilePicture.find(img => img.isProfile) || interest.profilePicture[0];
    return this.apiUrl + (profileImg.originalUrl || profileImg.thumbUrl || profileImg.filename || 'images/avatar.png');
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'images/avatar.png';
  }

  openViewer(pictures: ProfilePicture[] | undefined) {
    if (!pictures?.length) return;
    this.selectedImages = pictures.map(pic => this.apiUrl + (pic.originalUrl || pic.thumbUrl || pic.filename));
    this.viewerOpen = true;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobiles = window.innerWidth < 768;
  }

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  trackByInterest(index: number, item: Interest) {
    return item.interestId;
  }
getStatusLabel(interest: any): string {

  if (interest.status === 'pending') {
    return interest.initiatedBy === this.currentUserId
      ? 'Pending (Sent)'
      : 'Pending (Received)';
  }

  if (interest.status === 'accepted') {
    return interest.initiatedBy === this.currentUserId
      ? 'Accepted By Them'
      : 'You Accepted';
  }

  if (interest.status === 'rejected') {
    return interest.initiatedBy === this.currentUserId
      ? 'Rejected By Them'
      : 'You Rejected';
  }

  if (interest.status === 'cancelled') {
    return 'Cancelled';
  }

  return interest.status;
}



/**
 * Normalize status field (handles status & newStatus)
 */
getHistoryStatus(history: any): string {
  return history.status || history.newStatus || '';
}

/**
 * Show proper action message
 */
getStatusActionText(history: any): string {
  const isMe = history.updatedBy === this.currentUserId;
  const status = this.getHistoryStatus(history);

  switch (status) {
    case 'pending':
      return isMe
        ? 'You sent this interest'
        : 'Interest sent to you';

    case 'accepted':
      return isMe
        ? 'You accepted this interest'
        : 'Your interest was accepted';

    case 'rejected':
      return isMe
        ? 'You rejected this interest'
        : 'Your interest was rejected';

    case 'cancelled':
      return isMe
        ? 'You cancelled this interest'
        : 'Interest was cancelled';

    default:
      return '';
  }
}



}
