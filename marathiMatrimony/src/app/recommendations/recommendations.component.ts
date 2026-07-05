import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { DashboardService } from '../services/dashboard.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
import 'jspdf-autotable';

// import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// import QRCode from 'qrcode';
import QRCode from 'qrcode';
import html2pdf from 'html2pdf.js';
import Html2PdfOptions from "html2pdf.js";
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';
import { ProfilePdfService } from '../services/profile-pdf.service';
import { HttpClientModule } from '@angular/common/http';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
  imports: [HttpClientModule, CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, ImageViewerComponent],
})
export class RecommendationsComponent implements OnInit, AfterViewInit {
    @Input() selectedProfiles: any | null = null;

  // ---------------- DATA ----------------
  recommendations: any[] = [];
  topMatch: any = null;
  // pauseScroll = false;

  // ---------------- USER ----------------
  user: { isPremium: boolean } = { isPremium: false };

  // ---------------- POPUP / SLIDESHOW ----------------
  selectedProfile: any = null;
  currentPhotoIndex: number = 0;
  slideshowInterval: any = null;
  isPaused: boolean = false;

  // ---------------- IMAGE POPUP ----------------
  popupImage: string | null = null;

  // ---------------- CONFIG ----------------
  apiUrl: string = environment.apiUrl;

  // ---------------- SCROLL ----------------
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef<HTMLDivElement>;
  private isDragging = false;
  private startX = 0;
  private scrollStart = 0;

  constructor(
    private dashboardService: DashboardService, 
    private router: Router, 
    private snackBar: MatSnackBar, 
    private pdfservice: ProfilePdfService, 
    private srchservice: SearchService
) {}

  ngOnInit(): void {
    const viewContactUserId = sessionStorage.getItem('viewContactUserId');

    if (viewContactUserId) {
      this.router.navigate(['/search-profile']);
      return;
    }
    
    this.loadRecommendations();
  }

  ngAfterViewInit(): void {
    this.initCarouselDrag();
  }

  // ---------------- LOAD DATA ----------------
  loadRecommendations(): void {
    this.dashboardService.getRecommendationsnew().subscribe({
      next: (res: any) => {
        this.topMatch = res?.topMatch ?? null;
        this.recommendations = res?.recommendations ?? [];
      },
      error: (err) => console.error('Error fetching recommendations:', err),
    });
  }

  // ---------------- CAROUSEL SCROLL ----------------
  scrollLeft(amount: number = 180): void {
    this.scrollContainer?.nativeElement.scrollBy({ left: -amount, behavior: 'smooth' });
  }

  scrollRight(amount: number = 180): void {
    this.scrollContainer?.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
  }

  private initCarouselDrag(): void {
    if (!this.scrollContainer) return;
    const slider = this.scrollContainer.nativeElement;

    // ----- Desktop Drag -----
    slider.addEventListener('mousedown', (e: MouseEvent) => this.startDrag(e.pageX, slider));
    slider.addEventListener('mousemove', (e: MouseEvent) => this.dragMove(e.pageX, slider));
    slider.addEventListener('mouseup', () => this.endDrag());
    slider.addEventListener('mouseleave', () => this.endDrag());

    // ----- Mobile Touch Drag -----
    slider.addEventListener('touchstart', (e: TouchEvent) => this.startDrag(e.touches[0].pageX, slider));
    slider.addEventListener('touchmove', (e: TouchEvent) => this.dragMove(e.touches[0].pageX, slider));
    slider.addEventListener('touchend', () => this.endDrag());
  }

  private startDrag(pageX: number, slider: HTMLDivElement): void {
    this.isDragging = true;
    this.startX = pageX - slider.offsetLeft;
    this.scrollStart = slider.scrollLeft;
  }

  private dragMove(pageX: number, slider: HTMLDivElement): void {
    if (!this.isDragging) return;
    const walk = (pageX - this.startX) * 1.5;
    slider.scrollLeft = this.scrollStart - walk;
  }

  private endDrag(): void {
    this.isDragging = false;
  }

  // ---------------- QUICK VIEW ----------------
  openQuickView(profile: any): void {
    this.selectedProfile = profile;
    this.currentPhotoIndex = 0;
    this.isPaused = false;
    if (this.selectedProfile) this.selectedProfile.showContact = false;
    this.startSlideshow();
  }

  closeQuickView(): void {
    this.selectedProfile = null;
    this.currentPhotoIndex = 0;
    this.clearSlideshow();
  }

  // ---------------- SLIDESHOW ----------------
  startSlideshow(): void {
    this.clearSlideshow();
    if (this.selectedProfile?.photoDetails?.profilePicture?.length > 1 && !this.isPaused) {
      this.slideshowInterval = setInterval(() => this.nextPhoto(), 3000);
    }
  }

  clearSlideshow(): void {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
    }
  }

  pauseSlideshow(): void {
    this.isPaused = true;
    this.clearSlideshow();
  }

  resumeSlideshow(): void {
    this.isPaused = false;
    this.startSlideshow();
  }

  nextPhoto(): void {
    const photos = this.selectedProfile?.photoDetails?.profilePicture || [];
    if (!photos.length) return;
    this.currentPhotoIndex = (this.currentPhotoIndex + 1) % photos.length;
  }

  prevPhoto(): void {
    const photos = this.selectedProfile?.photoDetails?.profilePicture || [];
    if (!photos.length) return;
    this.currentPhotoIndex = (this.currentPhotoIndex - 1 + photos.length) % photos.length;
  }

  getCurrentPhoto(): string {
    const photos = this.selectedProfile?.photoDetails?.profilePicture || [];
    if (!photos.length) return 'images/avatar.png';
    return this.apiUrl + '/uploads/profile/originals/' + photos[this.currentPhotoIndex].filename;
  }

  // ---------------- IMAGE POPUP ----------------
  openImagePopup(filename: string): void {
    if (!filename) return;
    this.popupImage = this.apiUrl + '/uploads/profile/originals/' + filename;
  }

  closeImagePopup(): void {
    this.popupImage = null;
  }

  onImageError(event: any): void {
    event.target.src = 'images/avatar.png';
  }

 toggleInterest(profile: any): void {
  if (!profile || profile.isLoading) return;

  profile.isLoading = true;

  // ===============================
  // CANCEL INTEREST
  // ===============================
  if (profile.interestStatus === 'pending') {

    if (!profile.interestId) {
      console.error('Missing interestId for cancel');
      profile.isLoading = false;
      return;
    }

    this.srchservice.withdrawInterest(profile.interestId)
      .subscribe({
        next: (success: boolean) => {
          if (success) {
            profile.interestStatus = 'cancelled';
            profile.interestId = null;
          }
          profile.isLoading = false;
        },
        error: () => {
          profile.isLoading = false;
        }
      });

    return;
  }

  // ===============================
  // ACCEPTED → DO NOTHING
  // ===============================
  if (profile.interestStatus === 'accepted') {
    profile.isLoading = false;
    return;
  }

  // ===============================
  // SEND INTEREST
  // ===============================
  this.srchservice.sendInterest(profile.userId)
    .subscribe({
      next: (res: any) => {
        profile.interestStatus = 'pending';
        profile.interestId = res?.interestId; // MUST come from backend
        profile.isLoading = false;
      },
      error: () => {
        profile.isLoading = false;
      }
    });
}


// toggleInterest(profile: any): void {
//     if (!profile || profile.isLoading) return;

//     profile.isLoading = true;

//     // Decide which service call to make
//     const request$ = profile.hasInterest
//       ? this.srchservice.removeInterest(profile)
//       : this.srchservice.sendInterest(profile);

//     request$.subscribe({
//       next: () => {
//         // Toggle the interest status
//         profile.hasInterest = !profile.hasInterest;
//         profile.isLoading = false;
//       },
//       error: () => {
//         profile.isLoading = false;
//       }
//     });
//   }


sendInterest(profile: any): void {
  if (profile.hasInterest) return;

  profile.isLoading = true;
console.log("step1");
  this.srchservice.sendInterest(profile).subscribe({
    next: () => {
      profile.hasInterest = true;
      profile.isLoading = false;
    },
    error: () => {
      profile.isLoading = false;
    }
  });
}

removeInterest(profile: any): void {
  if (!profile.hasInterest) return;

  profile.isLoading = true;

  this.srchservice.removeInterest(profile).subscribe({
    next: () => {
      profile.hasInterest = false;
      profile.isLoading = false;
    },
    error: () => {
      profile.isLoading = false;
    }
  });
}



  addToShortlist(profile: any): void {
    if (!profile) return;
    if (profile.isPremium && !this.user.isPremium) {
      alert('Upgrade to premium to shortlist!');
      return;
    }
    profile.isShortlisted = true;
  }

  // ---------------- NAVIGATION ----------------
  goToAllMatches(): void {
    this.router.navigate(['/search-profile']);
  }

  skipRecommendation(rec: any): void {
    if (!rec) return;
    this.recommendations = this.recommendations.filter((r) => r.userId !== rec.userId);
  }

  // ---------------- CONTACT ----------------
deductContact(): void {
  if (!this.selectedProfile) return;

  this.dashboardService.deductContact(this.selectedProfile.userId).subscribe({
    next: (res: any) => {

      // ✅ CASE 1: Contact already viewed → always show contact
      if (res.alreadyViewed === true) {
        this.selectedProfile.showContact = true;
        return;
      }

      // ✅ CASE 2: Normal deduction response
      this.selectedProfile.showContact = res.canViewMore === true;

      // ❌ CASE 3: Limit reached → show upgrade popup
      if (res.canViewMore === false) {
        const msg =
          res.policyType === 'UNLIMITED'
            ? 'Your total contact quota is finished.'
            : 'Your contact limit has been reached.';

        // const snackRef = this.snackBar.open(
        //   `${msg}\n\nDo you want to upgrade your plan?`,
        //   'Upgrade',
        //   {
        //     duration: 6000,
        //     horizontalPosition: 'center',
        //     verticalPosition: 'top'
        //   }
        // );

        // snackRef.onAction().subscribe(() => {
        //   this.router.navigate(['/upgrade-userplans']);
        // });

        if (confirm(`${msg}\n\nDo you want to upgrade your plan?`)) {
          this.router.navigate(['/upgrade-userplans']);
        }
      }
    },

    error: (err) => {
      console.error('Failed to deduct contact', err);

      const errorMsg =
        err?.error?.error ||
        'Contact limit reached. Please upgrade your plan.';

      // const snackRef = this.snackBar.open(
      //     `${errorMsg}\n\nDo you want to upgrade your plan?`,
      //     'Upgrade',
      //     {
      //       duration: 6000,
      //       horizontalPosition: 'center',
      //       verticalPosition: 'top'
      //     }
      //   );

      //   snackRef.onAction().subscribe(() => {
      //     this.router.navigate(['/upgrade-userplans']);
      //   });
      if (confirm(`${errorMsg}\n\nDo you want to upgrade your plan?`)) {
        this.router.navigate(['/upgrade-userplans']);
      }
    }
  });
}



   // existing properties like topMatch, recommendations, etc.

  /**
   * Returns a class name based on match score
   * High (>=80) => green
   * Medium (50-79) => orange
   * Low (<50) => red
   */
  getScoreClass(score: number | undefined): string {
    if (!score) return 'green'; // default green if undefined
    if (score >= 80) return 'green';
    if (score >= 50) return 'orange';
    return 'red';
  }


// Create a downloadable PDF (simple stub)

downloadProfilePdf() {
  if (!this.selectedProfile) return;

  const profile = this.selectedProfile;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = margin;

  const sectionSpacing = 8;

  const addSectionTitle = (title: string) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 6;
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  const addInfo = (label: string, value: string) => {
    if (!value) return;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const text = `${label}: ${value}`;
    const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
    if (y + splitText.length * 6 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(splitText, margin, y);
    y += splitText.length * 6;
  };

  // ---------- PERSONAL INFORMATION ----------
  addSectionTitle('Personal Information');
  addInfo('User ID', profile.userId || '');
  const name = [profile.personalDetails?.firstName, profile.personalDetails?.middleName, profile.personalDetails?.lastName]
                .filter(Boolean).join(' ');
  addInfo('Name', name);
  addInfo('Age', profile.personalDetails?.age?.toString());
  addInfo('Gender', profile.personalDetails?.gender);
  addInfo('Date of Birth', profile.personalDetails?.dateOfBirth);
  addInfo('Height', profile.personalDetails?.height ? `${profile.personalDetails.height} ${profile.personalDetails?.heightUnit || ''}` : '');
  addInfo('Weight', profile.personalDetails?.weight ? `${profile.personalDetails.weight} kg` : '');
  addInfo('Blood Group', profile.personalDetails?.bloodGroup);
  addInfo('Marital Status', profile.personalDetails?.maritalStatus);
  addInfo('Religion', profile.personalDetails?.religion);
  addInfo('Caste', profile.personalDetails?.caste);
  addInfo('Sub-caste', profile.personalDetails?.subCaste);
  addInfo('Complexion', profile.personalDetails?.complexion);
  addInfo('Diet', profile.personalDetails?.diet);
  addInfo('Languages', profile.personalDetails?.languagesSpoken);
  addInfo('Spectacles', profile.personalDetails?.spectacles);
  addInfo('Lens', profile.personalDetails?.lens);
  addInfo('Disability', profile.personalDetails?.physicalDisability);
  addInfo('Disability Details', profile.personalDetails?.disabilityDetails);

  y += sectionSpacing;

  // ---------- EDUCATION ----------
  if (profile.educationDetails) {
    addSectionTitle('Education Details');
    addInfo('Highest Qualification', profile.educationDetails?.highestQualification);
    addInfo('College', profile.educationDetails?.collegeName);
    addInfo('Education Type', profile.educationDetails?.educationType);
    addInfo('Year of Completion', profile.educationDetails?.yearOfCompletion);
    addInfo('Additional Qualification', profile.educationDetails?.additionalQualifications);
    y += sectionSpacing;
  }

  // ---------- CAREER ----------
  if (profile.careerDetails) {
    addSectionTitle('Career Details');
    addInfo('Occupation', profile.careerDetails?.occupation);
    addInfo('Job Title', profile.careerDetails?.jobTitle);
    addInfo('Company', profile.careerDetails?.companyName);
    addInfo('Employment Type', profile.careerDetails?.employmentType);
    addInfo('Annual Income', profile.careerDetails?.annualIncome);
    addInfo('Work Location', [profile.careerDetails?.workLocationCity, profile.careerDetails?.workLocationCountry].filter(Boolean).join(', '));
    addInfo('Previous Experience', profile.careerDetails?.previousWorkExperience);
    y += sectionSpacing;
  }

  // ---------- LIFESTYLE ----------
  if (profile.lifestyleDetails) {
    addSectionTitle('Lifestyle & Interests');
    addInfo('Diet', profile.lifestyleDetails?.diet);
    addInfo('Smoking', profile.lifestyleDetails?.smoking);
    addInfo('Drinking', profile.lifestyleDetails?.drinking);
    addInfo('Favorite Books', profile.lifestyleDetails?.favoriteBooks);
    addInfo('Favorite Movies', profile.lifestyleDetails?.favoriteMovies);
    addInfo('TV Shows', profile.lifestyleDetails?.favoritetvShows);
    addInfo('Hobbies', profile.lifestyleDetails?.hobbies);
    addInfo('Sports', profile.lifestyleDetails?.sportsActivities);
    y += sectionSpacing;
  }

  // ---------- CONTACT ----------
  addSectionTitle('Contact Details');
  if (profile.showContact) {
    addInfo('Phone', profile.contactDetails?.phoneNumber);
    addInfo('Email', profile.contactDetails?.emailAddress);
    addInfo('Country', profile.contactDetails?.country);
    addInfo('State', profile.contactDetails?.state);
    addInfo('City', profile.contactDetails?.city);
  } else {
    addInfo('Contact Info', 'Locked / Premium');
  }
  y += sectionSpacing;

  // ---------- FAMILY ----------
  if (profile.familyDetails) {
    addSectionTitle('Family Details');
    addInfo('Father', profile.familyDetails?.fatherName);
    addInfo('Mother', profile.familyDetails?.motherName);
    addInfo('Family Type', profile.familyDetails?.familyType);
    addInfo('Family Wealth', profile.familyDetails?.familyWealth);
    addInfo('Brothers', profile.familyDetails?.brothersCount);
    addInfo('Sisters', profile.familyDetails?.sistersCount);
    addInfo('Native', [profile.familyDetails?.nativeTaluka, profile.familyDetails?.nativeDistrict].filter(Boolean).join(', '));
    addInfo('Parents Reside', profile.familyDetails?.parentsResidentCity);
    addInfo('Mama', profile.familyDetails?.mamaNameAndPlace);
    addInfo('Relatives', profile.familyDetails?.relativesSurnames);
    addInfo('Intercaste Marriage', profile.familyDetails?.intercasteMarriage);
    addInfo('Intercaste Details', profile.familyDetails?.intercasteDetails);
    y += sectionSpacing;
  }

  // ---------- PARTNER PREFERENCES ----------
  if (profile.partnerPreferencesDetails) {
    addSectionTitle('Partner Preferences');
    addInfo('Expectations', profile.additionalInfoDetails?.partnerExpectations);
    addInfo('Age Range', profile.partnerPreferencesDetails?.ageRange);
    addInfo('Height Preference', profile.partnerPreferencesDetails?.heightPreference);
    addInfo('Education Preferences', profile.partnerPreferencesDetails?.educationPreferences);
    addInfo('Occupation Preferences', profile.partnerPreferencesDetails?.occupationPreferences);
    addInfo('Languages Preferences', profile.partnerPreferencesDetails?.languagesPreferences);
    addInfo('Lifestyle Preferences', profile.partnerPreferencesDetails?.lifestylePreferences);
    addInfo('Preferred Locations', profile.partnerPreferencesDetails?.locationPreferences);
    addInfo('Religion & Caste', profile.partnerPreferencesDetails?.religionCastePreferences);
  }

  // ---------- SAVE PDF ----------
  doc.save(`${profile.userId || 'profile'}_biodata.pdf`);
}

downloadPdf() 
{
    this.pdfservice.generateProfilePdf(this.selectedProfile);
}

generateProfilePdfMr() 
{
    this.pdfservice.generateProfilePdfMr(this.selectedProfile);
}


async downloadProfilePdf1() {
  const p = this.selectedProfile;
  if (!p) return;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 10;

  // ===========================
  // PROFILE IMAGE (optional)
  // ===========================
  if (p.profileImageBase64) {
    doc.addImage(p.profileImageBase64, "JPEG", 10, 10, 30, 30);
  }

  // ===========================
  // HEADER CARD
  // ===========================
  doc.setFillColor(245, 245, 255);
  doc.roundedRect(45, 10, 155, 30, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`${p.personalDetails?.firstName} ${p.personalDetails?.lastName}`, 50, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`User ID: ${p.userId}`, 50, 33);
  doc.text(`Age: ${p.personalDetails?.age} yrs`, 110, 33);
  doc.text(`Gender: ${p.personalDetails?.gender}`, 150, 33);

  y = 50;

  // ============================================================
  // SECTION TITLE COMPONENT
  // ============================================================
  const sectionTitle = (title: string) => {
    doc.setFillColor(50, 90, 255);
    doc.roundedRect(10, y, 190, 8, 2, 2, "F");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 15, y + 6);
    doc.setTextColor(0);
    y += 12;
  };

  // ============================================================
  // TAG CHIP UI COMPONENT
  // ============================================================
  const addTag = (text: string, x: number, row: number) => {
    doc.setFillColor(235, 239, 255);
    doc.roundedRect(x, y + (row * 10), 60, 7, 3, 3, "F");
    doc.setFontSize(9);
    doc.text(text, x + 3, y + 5 + (row * 10));
  };

  // ============================================================
  // PERSONAL INFO
  // ============================================================
  sectionTitle("Personal Information");

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [230, 235, 255], textColor: 0 },
    body: [
      ["DOB", p.personalDetails?.dateOfBirth],
      ["Height", p.personalDetails?.height + " feet"],
      ["Weight", p.personalDetails?.weight + " kg"],
      ["Blood Group", p.personalDetails?.bloodGroup],
      ["Religion", p.personalDetails?.religion],
      ["Caste", p.personalDetails?.caste + " / " + p.personalDetails?.subCaste],
      ["Complexion", p.personalDetails?.complexion],
      ["Marital Status", p.personalDetails?.maritalStatus],
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ========================
  // LANGUAGES & DIET as TAGS
  // ========================
  sectionTitle("Lifestyle Overview");

  let row = 0;
  addTag("Diet: " + p.personalDetails?.diet, 10, row);
  addTag("Spectacles: " + p.personalDetails?.spectacles, 75, row);
  addTag("Lens: " + p.personalDetails?.lens, 140, row); row++;

  addTag("Languages: " + p.personalDetails?.languagesSpoken, 10, row);

  y += row * 10 + 15;

  // ============================================================
  // EDUCATION
  // ============================================================
  sectionTitle("Education Details");

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10 },
    body: [
      ["Highest Qualification", p.educationDetails?.highestQualification],
      ["College", p.educationDetails?.collegeName],
      ["Education Type", p.educationDetails?.educationType],
      ["Passing Year", p.educationDetails?.yearOfCompletion]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================
  // CAREER
  // ============================================================
  sectionTitle("Career Details");

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10 },
    body: [
      ["Occupation", p.careerDetails?.occupation],
      ["Job Title", p.careerDetails?.jobTitle],
      ["Company", p.careerDetails?.companyName],
      ["Annual Income", p.careerDetails?.annualIncome],
      ["Work Location", `${p.careerDetails?.workLocationCity}, ${p.careerDetails?.workLocationCountry}`],
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================
  // FAMILY INFO
  // ============================================================
  sectionTitle("Family Details");

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10 },
    body: [
      ["Father", p.familyDetails?.fatherName],
      ["Mother", p.familyDetails?.motherName],
      ["Family Type", p.familyDetails?.familyType],
      ["Brothers", p.familyDetails?.brothersCount],
      ["Sisters", p.familyDetails?.sistersCount],
      ["Native", `${p.familyDetails?.nativeTaluka}, ${p.familyDetails?.nativeDistrict}`],
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================
  // PARTNER PREFERENCE
  // ============================================================
  sectionTitle("Partner Preferences");

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10 },
    body: [
      ["Age Range", p.partnerPreferencesDetails?.ageRange],
      ["Height Preference", p.partnerPreferencesDetails?.heightPreference],
      ["Education", p.partnerPreferencesDetails?.educationPreferences],
      ["Occupation", p.partnerPreferencesDetails?.occupationPreferences],
      ["Language", p.partnerPreferencesDetails?.languagesPreferences],
      ["Location Preference", p.partnerPreferencesDetails?.locationPreferences],
      ["Expectations", p.additionalInfoDetails?.partnerExpectations],
    ]
  });

  doc.save(`${p.userId}_Biodata.pdf`);
}

 pauseScroll = false;

  galleryImages: any[] = [];
  selectedImage = '';
  isGalleryOpen = false;

  /** PROFILE IMAGE (thumb) */
  getProfileThumb(user: any): string {
    const profile = user?.photoDetails?.profilePicture
      ?.find((img: any) => img.isProfile === true);

    return profile?.originalUrl
      ? this.apiUrl + profile.originalUrl
      : 'assets/avatar.png';
  }

  /** OPEN GALLERY */
  openGallery(user: any) {
    const images = user?.photoDetails?.profilePicture;
    if (!images?.length) return;

    this.galleryImages = images;

    const profile = images.find((img: any) => img.isProfile);
    this.selectedImage = this.apiUrl +
      (profile?.originalUrl || images[0].originalUrl);

    this.isGalleryOpen = true;
  }

  /** CHANGE IMAGE */
  selectImage(img: any) {
    this.selectedImage = this.apiUrl + img.originalUrl;
  }

  /** CLOSE MODAL */
  closeGallery() {
    this.isGalleryOpen = false;
  }

  viewerOpen = false;
  selectedImages: any[] = [];

  openViewer(images: any[]) {
    this.selectedImages = images;
    this.viewerOpen = true;
  }

}
