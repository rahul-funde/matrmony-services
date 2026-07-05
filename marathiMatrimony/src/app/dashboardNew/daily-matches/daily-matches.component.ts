import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Observable, of, Subscription, fromEvent, timer } from 'rxjs';
import {
  catchError,
  tap,
  retry,
  finalize,
  delay,
  debounceTime,
  map,
} from 'rxjs/operators';
import { DashboardDataService } from '../service/dashboard-data.service';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { NgFor, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CityFilterPipe } from '../city-filter.pipe';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export interface Match {
  id: number;
  name: string;
  age: number;
  city: string;
  profession: string;
  photo: string;
  compatibility?: number;
  interestSent?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-daily-matches',
  templateUrl: './daily-matches.component.html',
  styleUrls: ['./daily-matches.component.css'],
  imports: [
    CommonModule,
    NgFor,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    CityFilterPipe,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        query(
          '.match-card',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(80, [
              animate(
                '500ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class DailyMatchesComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /** Stream of matches from API or mock data */
  matches$!: Observable<Match[]>;

  /** City filter input bound via ngModel */
  filterCity = '';

  /** UI states */
  isLoading = false;
  errorMsg = '';

  /** Scroll references */
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  showLeftArrow = false;
  showRightArrow = false;
  scrollProgress = 0;

  /** Subscriptions */
  private scrollSub?: Subscription;
  private autoScrollSub?: Subscription;
  private filterSub?: Subscription;

  /** Auto-scroll toggle */
  enableAutoScroll = false;

  constructor(
    private dataService: DashboardDataService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}


  ngOnInit(): void {
    this.loadMatches();
    this.setupDebouncedFilter();
  }

  ngAfterViewInit(): void {
    this.initScrollObserver();
  }

  ngOnDestroy(): void {
    this.scrollSub?.unsubscribe();
    this.autoScrollSub?.unsubscribe();
    this.filterSub?.unsubscribe();
  }

  // =============================
  // 🔄 Data Loading & Error Logic
  // =============================

  private loadMatches(): void {
    this.isLoading = true;

    this.matches$ = this.dataService.getMatches().pipe(
      delay(600), // shimmer delay for realism
      retry({ count: 2, delay: 1000 }),
      tap(() => {
        this.isLoading = false;
        this.checkScrollState();
      }),
      catchError((err) => {
        console.error('Error loading matches:', err);
        this.showError('Unable to load matches. Please try again later.');
        this.isLoading = false;
        return of([]);
      }),
      finalize(() => (this.isLoading = false))
    );
  }

  // =============================
  // 🔍 Debounced Filter Handling
  // =============================

  private setupDebouncedFilter(): void {
    // Reactive debounce: only filter after 300ms pause
    this.filterSub = fromEvent<KeyboardEvent>(
      document.querySelector('input[matInput]') as HTMLInputElement,
      'input'
    )
      .pipe(
        debounceTime(300),
        map((e) => (e.target as HTMLInputElement).value.trim())
      )
      .subscribe((val) => (this.filterCity = val));
  }

  clearFilter(): void {
    this.filterCity = '';
  }

  // =============================
  // 💌 Interest / Profile / Message
  // =============================

  toggleInterest(match: Match): void {
    if (match.interestSent) {
      this.showInfo(`Interest already sent to ${match.name}`);
      return;
    }

    match.interestSent = true;
    this.showSuccess(`Interest sent to ${match.name} ❤️`, 'Undo', () => {
      match.interestSent = false;
    });
  }

  sendMessage(match: Match): void {
    this.showInfo(`Opening chat with ${match.name} 💬`);
  }

  viewProfile(match: Match): void {
    this.showInfo(`Viewing ${match.name}’s profile 👀`);
  }

  // =============================
  // ⬅️➡️ Scroll Controls
  // =============================

  scrollLeft(): void {
    this.scrollContainer?.nativeElement.scrollBy({
      left: -320,
      behavior: 'smooth',
    });
  }

  scrollRight(): void {
    this.scrollContainer?.nativeElement.scrollBy({
      left: 320,
      behavior: 'smooth',
    });
  }

  private initScrollObserver(): void {
    if (!this.scrollContainer) return;

    const el = this.scrollContainer.nativeElement;
    this.scrollSub = fromEvent(el, 'scroll')
      .pipe(debounceTime(100))
      .subscribe(() => this.checkScrollState());

    // optional: start auto scroll
    if (this.enableAutoScroll) {
      this.autoScrollSub = timer(3000, 5000).subscribe(() => {
        this.scrollRight();
      });
    }

    // check initial state
    setTimeout(() => this.checkScrollState(), 500);
  }

  checkScrollState(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    this.scrollProgress = el.scrollLeft / maxScroll;
    this.showLeftArrow = el.scrollLeft > 30;
    this.showRightArrow = el.scrollLeft < maxScroll - 30;
  }

  // =============================
  // ✅ Snackbar Utilities
  // =============================

  private showInfo(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 2500 });
  }

  private showSuccess(message: string, action?: string, undo?: () => void): void {
    const ref = this.snackBar.open(message, action, { duration: 3000 });
    if (undo) ref.onAction().subscribe(() => undo());
  }

  private showError(message: string): void {
    this.snackBar
      .open(message, 'Retry', { duration: 4000 })
      .onAction()
      .subscribe(() => this.loadMatches());
  }

  goToAllMatches() {
    this.router.navigate(['/search-profile']);
  }

  getCompatibility(value: number | null | undefined): string {
    return value ? `${value}% Match` : 'N/A Match';
  }

}
