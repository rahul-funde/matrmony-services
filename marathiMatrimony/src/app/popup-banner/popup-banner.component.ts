import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PopupBanner, LandingpageService } from '../services/landingpage.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment'

@Component({
  selector: 'app-popup-banner',
  standalone: true,
  imports: [CommonModule],   // ✅ REQUIRED
  templateUrl: './popup-banner.component.html',
  styleUrls: ['./popup-banner.component.css']
})
export class PopupBannerComponent implements OnInit, OnDestroy {

  banners: PopupBanner[] = [];
  currentIndex = 0;
  visible = false;
  intervalId: any;
  apiUrl = environment.apiUrl;

  constructor(
    private bannerService: LandingpageService,
    private router: Router
  ) {}

  // ngOnInit(): void {
  //   this.bannerService.getPopupBanners().subscribe(banners => {
  //     if (banners.length) {
  //       this.banners = banners;
  //       this.visible = true;
  //       this.startRotation();
  //     }
  //   });
  // }


  ngOnInit(): void {
    const dismissed = sessionStorage.getItem('popup_banner_closed');
    if (dismissed === 'true') return;

    this.bannerService.getPopupBanners().subscribe(banners => {
      if (!banners?.length) return;

      this.banners = banners;
      this.visible = true;
      this.startRotation();
    });
  }

  startRotation() {
    this.intervalId = setInterval(() => {
      this.currentIndex =
        (this.currentIndex + 1) % this.banners.length;
    }, 5000);
  }

  close() {
    this.visible = false;
    sessionStorage.setItem('popup_banner_closed', 'true');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }


  onCtaClick(action: string) {
    this.close();

    switch (action) {
      case 'login':
        this.router.navigate(['/login']);
        break;

      case 'upgrade':
        this.router.navigate(['/packages']);
        break;

      default:
        console.warn('Unknown CTA action:', action);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  
}
