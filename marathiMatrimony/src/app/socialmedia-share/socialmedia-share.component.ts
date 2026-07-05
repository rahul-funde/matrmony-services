import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { SocialMediaService } from '../services/socialmedia.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

/* ================= TYPES ================= */

type Language = 'en' | 'mr';

type MaritalGenderFilter =
  | 'UNMARRIED_BOYS'
  | 'UNMARRIED_GIRLS'
  | 'DIVORCED_MEN'
  | 'DIVORCED_WOMEN'
  | 'WIDOWER_MEN'
  | 'WIDOWER_WOMEN'
  | 'ALL';

interface LabelSet {
  lastName: string;
  profileId: string;
  education: string;
  occupation: string;
  city: string;
  link: string;
}

interface Profile {
  userId: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    gender: string;
    maritalStatus?: string;
    age?: number;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  professionalDetails?: {
    occupation?: string;
    company?: string;
  };
  education?: {
    highestQualification?: string;
    additionalQualification?: string;
    university?: string;
  };
  email?: string;
  mobilenumber?: string;
  plan?: string;
}

  // First, define allowed column keys
type ShareColumnKey =
  | 'name'
  | 'profileId'
  | 'gender'
  | 'age'
  | 'maritalStatus'
  | 'height'
  | 'education'
  | 'occupation'
  | 'income'
  | 'workCity'
  | 'nativePlace'
  | 'link';


@Component({
  selector: 'app-socialmedia-share',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PickerModule,
    MatSortModule
  ],
  templateUrl: './socialmedia-share.component.html',
  styleUrls: ['./socialmedia-share.component.css']
})
export class SocialmediaShareComponent implements OnInit {


selectedShareColumns: ShareColumnKey[] = [
    'name',
    'profileId',
    'gender',
    'age',
    'maritalStatus',
    'height',
    'education',
    'occupation',
    'workCity',
    'nativePlace',
    'income',
    'link'
  ];


allShareColumns: ShareColumnKey[] = [
  'name',
  'profileId',
  'gender',
  'age',
  'maritalStatus',
  'height',
  'education',
  'occupation',
  'income',
  'workCity',
  'nativePlace',
  'link'
];

  /* ================= TABLE ================= */
displayedColumns: string[] = [
  'select',
  'name',       // NEW
  'userId',
  'gender',
  'age',
  'maritalStatus',
  'plan',
  'height',
  'education',
  'occupation',
  'income',
  'workCity',
  'nativePlace'
];


  dataSource = new MatTableDataSource<Profile>([]);
  profiles: Profile[] = [];
  selectedProfiles: Profile[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  /* ================= FILTERS ================= */
  searchText = '';
  selectedMaritalGenderFilter: MaritalGenderFilter = 'ALL';
  selectedLanguage: Language = 'en';

  /* ================= MESSAGE / TEMPLATE ================= */
  shareMessage = '';
  templateName = '';
  selectedTemplateId = '';
  isEditing = false;

  savedTemplates: { id: string; name: string; content: string }[] = [];

  /* ================= UI ================= */
  showEmojiPicker = false;
  emojiPosition = { top: '0px', left: '0px' };
  isMobile = false;

  constructor(private smService: SocialMediaService) {}


// searchText = '';
// selectedMaritalGenderFilter = '';
selectedPlanFilter = '';

totalRecords = 0;
isLoading = false;
pageSize = 10; // default


  /* ================= INIT ================= */
  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;

    // this.smService.getProfiles().subscribe({
    //   next: (res: any) => {
    //     this.profiles = res.rows || [];
    //     this.dataSource.data = this.profiles;
    //     this.dataSource.paginator = this.paginator;
    //   },
    //   error: err => console.error('Profile load error:', err)
    // });


    this.loadTemplates();
    this.loadPlansFromSession();
    // this.loadProfiles(); // initial load

  }

loadProfiles(): void {
  if (!this.paginator || !this.sort) return;

  this.isLoading = true;

  const payload = {
    searchText: this.searchText || '',
    maritalGender: this.selectedMaritalGenderFilter || '',
    planId: this.selectedPlanFilter || '',
    sortBy: this.sort.active === 'age' ? 'personalDetails.age' :
            this.sort.active === 'income' ? 'careerDetails.annualIncome' :
            this.sort.active || 'createdAt',  // fallback
    sortDir: this.sort.direction || 'DESC',
    page: this.paginator.pageIndex,
    pageSize: this.paginator.pageSize
  };

  this.smService.getProfiles(payload).subscribe({
    next: (res: any) => {
      this.dataSource.data = res.data || [];
      this.totalRecords = res.total || 0;
      this.pageSize = res.pageSize
      this.isLoading = false;
    },
    error: err => {
      console.error('Profile load error:', err);
      this.isLoading = false;
    }
  });
}


onFilterChange(): void {
  this.paginator.firstPage(); // reset to page 1
  this.loadProfiles();
}


ngAfterViewInit(): void {
  this.dataSource.paginator = this.paginator;
  this.dataSource.sort = this.sort;

  // Sort change
  this.sort.sortChange.subscribe(() => {
    this.paginator.firstPage();
    this.loadProfiles();
  });

  // Paginator change
  this.paginator.page.subscribe((event: PageEvent) => {
    this.pageSize = event.pageSize;
      this.paginator.pageSize = event.pageSize;          // update paginator
  // this.paginator.firstPage(); 
    this.loadProfiles();
  });


  // Initial load
  this.loadProfiles();
}



  /* ================= EMOJI ================= */
  toggleEmojiPicker(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;

    if (this.showEmojiPicker && event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.emojiPosition = {
        top: rect.bottom + 5 + 'px',
        left: rect.left + 'px'
      };
    }
  }

  addEmoji(event: any): void {
    const emoji = event?.emoji?.native;
    if (!emoji) return;

    const textarea = document.querySelector('textarea[matInput]') as HTMLTextAreaElement;
    if (!textarea) {
      this.shareMessage += emoji;
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.shareMessage =
      this.shareMessage.slice(0, start) + emoji + this.shareMessage.slice(end);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    });
  }

  @HostListener('document:click', ['$event'])
  closeEmojiOnOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.emoji-popup') && !target.closest('.emoji-button')) {
      this.showEmojiPicker = false;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  /* ================= FILTER ================= */
applyAllFilters(): void {
  const text = this.searchText.trim().toLowerCase();

  this.dataSource.data = this.profiles.filter(p => {
    const pd = p.personalDetails;
    const fullName = `${pd.firstName} ${pd.lastName}`.toLowerCase();

    // 🔍 Name search
    if (text && !fullName.includes(text)) {
      return false;
    }

    // 💳 Plan filter (NEW)
    if (this.selectedPlanFilter) {
      if (!p.plan || p.plan.toLowerCase() !== this.selectedPlanFilter) {
        return false;
      }
    }

    // 💍 Marital + Gender filter (EXISTING)
    switch (this.selectedMaritalGenderFilter) {
      case 'UNMARRIED_BOYS':
        return pd.gender === 'Male' && pd.maritalStatus === 'Unmarried';

      case 'UNMARRIED_GIRLS':
        return pd.gender === 'Female' && pd.maritalStatus === 'Unmarried';

      case 'DIVORCED_MEN':
        return pd.gender === 'Male' && pd.maritalStatus === 'Divorcee';

      case 'DIVORCED_WOMEN':
        return pd.gender === 'Female' && pd.maritalStatus === 'Divorcee';

      case 'WIDOWER_MEN':
        return pd.gender === 'Male' && pd.maritalStatus === 'Widowed';

      case 'WIDOWER_WOMEN':
        return pd.gender === 'Female' && pd.maritalStatus === 'Widowed';

      default:
        return true;
    }
  });

  // 🔄 Reset selections after filtering
  this.selectedProfiles = [];
  this.prepareShareMessage();
}


  /* ================= SELECTION ================= */
  toggleSelection(profile: Profile, checked: boolean): void {
    if (checked && !this.isSelected(profile)) {
      this.selectedProfiles.push(profile);
    }
    if (!checked) {
      this.selectedProfiles = this.selectedProfiles.filter(p => p.userId !== profile.userId);
    }
    this.prepareShareMessage();
  }

  toggleSelectAll(checked: boolean): void {
    this.selectedProfiles = checked ? [...this.dataSource.filteredData] : [];
    this.prepareShareMessage();
  }

  isSelected(profile: Profile): boolean {
    return this.selectedProfiles.some(p => p.userId === profile.userId);
  }
  isAllSelected(): boolean {
    const visibleRows = this.dataSource.filteredData;
    return (
      visibleRows.length > 0 &&
      visibleRows.every(row =>
        this.selectedProfiles.some(p => p.userId === row.userId)
      )
    );
  }


  /* ================= MESSAGE BUILD ================= */
// Inside your class, outside any method
shareColumnMap: Record<ShareColumnKey, any> = {
  name: {
    icon: '👤',
    label: { en: 'Name', mr: 'नाव' },
    getValue: (p: any) => `${p.personalDetails?.lastName || ''}`.trim()
  },
  profileId: { icon: '🆔', label: { en: 'Profile ID', mr: 'प्रोफाइल ID' }, getValue: (p: any) => p.userId },
  gender: { icon: '⚥', label: { en: 'Gender', mr: 'लिंग' }, getValue: (p: any) => p.personalDetails?.gender || 'N/A' },
  age: { icon: '🎂', label: { en: 'Age', mr: 'वय' }, getValue: (p: any) => p.personalDetails?.age || 'N/A' },
  maritalStatus: { icon: '💍', label: { en: 'Marital Status', mr: 'वैवाहिक स्थिती' }, getValue: (p: any) => p.personalDetails?.maritalStatus || 'N/A' },
  height: { icon: '📏', label: { en: 'Height', mr: 'उंची' }, getValue: (p: any) => `${p.personalDetails?.height || 'N/A'} ${p.personalDetails?.heightUnit || ''}` },
  education: { icon: '🎓', label: { en: 'Education', mr: 'शिक्षण' }, getValue: (p: any) => p.educationDetails?.highestQualification || 'N/A' },
  occupation: { icon: '💼', label: { en: 'Occupation', mr: 'नोकरी' }, getValue: (p: any) => p.careerDetails?.occupation || 'N/A' },
  income: { icon: '💰', label: { en: 'Income', mr: 'उत्पन्न' }, getValue: (p: any) => p.careerDetails?.annualIncome },
  workCity: { icon: '🏢', label: { en: 'Work City', mr: 'कामाचे शहर' }, getValue: (p: any) => p.careerDetails?.workLocationCity || 'N/A' },
  nativePlace: { icon: '🏠', label: { en: 'Native Place', mr: 'मूळ गाव' }, getValue: (p: any) => `${p.familyDetails?.nativeTaluka || ''}, ${p.familyDetails?.nativeDistrict || ''}`.trim() },
  link: { icon: '🔗', label: { en: 'Profile Link', mr: 'प्रोफाइल लिंक' }, getValue: (p: any) => `${window.location.origin}/${window.location.pathname.split('/')[1] || 'en'}/welcome/${p.userId}` }
};

    // ------------------ Prepare message ------------------
  prepareShareMessage(): void {
    if (!this.selectedProfiles.length) {
      this.shareMessage = '';
      return;
    }

    const titleMap: Record<'en' | 'mr', string> = {
      en: 'Sushil Maratha Matrimony Profiles',
      mr: 'सुशील मराठा वधू-वर सूचक'
    };

    const headerMap: Record<'en' | 'mr', Record<string, string>> = {
      en: {
        UNMARRIED_BOYS: 'Unmarried Maratha Boys',
        UNMARRIED_GIRLS: 'Unmarried Maratha Girls',
        DIVORCED_MEN: 'Divorced Maratha Men',
        DIVORCED_WOMEN: 'Divorced Maratha Women',
        WIDOWER_MEN: 'Widower Maratha Men',
        WIDOWER_WOMEN: 'Widow Maratha Women',
        ALL: 'Suitable Maratha Matrimony Profiles'
      },
      mr: {
        UNMARRIED_BOYS: '👨🏻‍💼 अविवाहित मराठा मुले',
        UNMARRIED_GIRLS: '👩🏻‍💼 अविवाहित मराठा मुली',
        DIVORCED_MEN: '💔 घटस्फोट झालेले पुरुष',
        DIVORCED_WOMEN: '💔 घटस्फोट झालेल्या महिला',
        WIDOWER_MEN: '🕊️ विधुर पुरुष',
        WIDOWER_WOMEN: '🕊️ विधवा महिला',
        ALL: '❤️ योग्य मराठा विवाह प्रोफाइल्स'
      }
    };



    const header = `${titleMap[this.selectedLanguage]}
━━━━━━━━━━━━━━
${headerMap[this.selectedLanguage][this.selectedMaritalGenderFilter]}
━━━━━━━━━━━━━━`;

    const body = this.selectedProfiles.map((p, i) => {
      return `🌸 ${i + 1})\n` + this.selectedShareColumns
        .map(key => `${this.shareColumnMap[key].icon} ${this.shareColumnMap[key].label[this.selectedLanguage]}: ${this.shareColumnMap[key].getValue(p)}`)
        .join('\n');
    }).join('\n\n');

    this.shareMessage = `${header}\n\n${body}`;
  }
  /* ================= SHARE ================= */
  shareWhatsApp(): void {
    if (this.shareMessage) {
      window.open(`https://wa.me/?text=${encodeURIComponent(this.shareMessage)}`, '_blank');
    }
  }

  shareTelegram(): void {
    if (this.shareMessage) {
      window.open(`https://t.me/share/url?text=${encodeURIComponent(this.shareMessage)}`, '_blank');
    }
  }

  copyToClipboard(): void {
    if (this.shareMessage) navigator.clipboard.writeText(this.shareMessage);
  }

  copyMessageAndOpenFacebook(): void {
    if (!this.shareMessage) return;
    navigator.clipboard.writeText(this.shareMessage).then(() => {
      window.open('https://www.facebook.com/groups/61583194727638', '_blank');
    });
  }

  /* ================= TEMPLATES ================= */
  loadTemplates(): void {
    this.smService.getTemplates().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.savedTemplates = res.templates
            .filter((t: any) => t.id)
            .map((t: any) => ({ id: t.id, name: t.name, content: t.content }));
        }
      },
      error: err => console.error(err)
    });
  }

  applyTemplate(): void {
    const t = this.savedTemplates.find(x => x.id === this.selectedTemplateId);
    if (!t) {
      this.resetTemplateForm();
      return;
    }
    this.templateName = t.name;
    this.shareMessage = t.content;
    this.isEditing = true;
  }

  saveTemplate(): void {
    if (!this.templateName || !this.shareMessage) return;

    const payload = { name: this.templateName, content: this.shareMessage };

    if (this.isEditing && this.selectedTemplateId) {
      this.smService.updateTemplate(this.selectedTemplateId, payload).subscribe(() => {
        this.loadTemplates();
        this.resetTemplateForm();
      });
    } else {
      this.smService.createTemplate(payload).subscribe(() => {
        this.loadTemplates();
        this.resetTemplateForm();
      });
    }
  }

  deleteTemplate(id: string): void {
    if (!confirm('Delete this template?')) return;
    this.smService.deleteTemplate(id).subscribe(() => {
      this.loadTemplates();
      this.resetTemplateForm();
    });
  }

  resetTemplateForm(): void {
    this.templateName = '';
    this.selectedTemplateId = '';
    this.isEditing = false;
  }

  formatIncome(amount?: string): string {
  if (!amount) return 'Well settled';
  const lpa = Number(amount) / 100000;
  return `₹${lpa.toFixed(1)} LPA`;
}

 // ------------------ Toggle columns ------------------
  onShareColumnToggle(key: ShareColumnKey, checked: boolean): void {
    if (!this.selectedShareColumns) this.selectedShareColumns = [];
    if (checked) {
      if (!this.selectedShareColumns.includes(key)) this.selectedShareColumns.push(key);
    } else {
      this.selectedShareColumns = this.selectedShareColumns.filter(k => k !== key);
    }
    this.prepareShareMessage(); // auto update
  }


  plans: {
    value: string;
    label: string;
    id: string;
    status: string;
  }[] = [];

  // selectedPlanFilter: string = '';

  loadPlansFromSession() {
    const stored = sessionStorage.getItem('plans');

    if (stored) {
      this.plans = JSON.parse(stored);
    }
  }

}
