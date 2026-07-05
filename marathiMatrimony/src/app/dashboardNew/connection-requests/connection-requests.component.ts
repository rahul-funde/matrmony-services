import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { Observable } from 'rxjs';
import { DashboardDataService } from '../service/dashboard-data.service';

/** ✅ Define a strong type for request data */
interface ConnectionPerson {
  name: string;
  city: string;
  photo: string;
}

@Component({
  standalone: true,
  selector: 'app-connection-requests',
  templateUrl: './connection-requests.component.html',
  styleUrls: ['./connection-requests.component.css'],
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(15px) scale(0.98)' }),
            stagger(60, [
              animate(
                '400ms cubic-bezier(0.25, 0.8, 0.25, 1)',
                style({ opacity: 1, transform: 'translateY(0) scale(1)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class ConnectionRequestsComponent implements OnInit, AfterViewInit {
  /** ✅ Tab state */
  activeTab = 0;

  /** ✅ Observable-based data */
  receivedRequests$!: Observable<ConnectionPerson[]>;
  sentRequests$!: Observable<ConnectionPerson[]>;
  acceptedConnections$!: Observable<ConnectionPerson[]>;

  /** ✅ Current list */
  currentList$: Observable<ConnectionPerson[]> | null = null;

  /** ✅ Scroll controls */
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  showLeftArrow = false;
  showRightArrow = true;

  constructor(
    private snackBar: MatSnackBar,
    private dataService: DashboardDataService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.updateCurrentList();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.checkScrollArrows(), 300);
  }

  /** ✅ Load data once */
  private loadData(): void {
    this.receivedRequests$ = this.dataService.getReceivedRequests();
    this.sentRequests$ = this.dataService.getSentRequests();
    this.acceptedConnections$ = this.dataService.getAcceptedConnections();
  }

  /** ✅ Switch tab */
  onTabChange(index: number): void {
    this.activeTab = index;
    this.updateCurrentList();

    // reset scroll position when tab changes
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollLeft = 0;
        this.checkScrollArrows();
      }
    }, 100);
  }

  private updateCurrentList(): void {
    switch (this.activeTab) {
      case 0:
        this.currentList$ = this.receivedRequests$;
        break;
      case 1:
        this.currentList$ = this.sentRequests$;
        break;
      case 2:
        this.currentList$ = this.acceptedConnections$;
        break;
      default:
        this.currentList$ = null;
    }
  }

  /** ✅ UI Actions */
  viewProfile(person: ConnectionPerson): void {
    this.snackBar.open(`👀 Viewing ${person.name}'s profile`, 'Close', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  acceptRequest(person: ConnectionPerson): void {
    this.snackBar.open(`💖 Accepted ${person.name}'s request`, 'Close', {
      duration: 2500,
    });
  }

  declineRequest(person: ConnectionPerson): void {
    this.snackBar.open(`❌ Declined ${person.name}'s request`, 'Close', {
      duration: 2500,
    });
  }

  /** ✅ Status Label */
  getStatusLabel(): string {
    return ['Pending', 'Sent', 'Connected'][this.activeTab] || '';
  }

  /** ✅ Scroll Logic */
  scrollLeft(): void {
    this.scrollContainer.nativeElement.scrollBy({
      left: -300,
      behavior: 'smooth',
    });
    setTimeout(() => this.checkScrollArrows(), 400);
  }

  scrollRight(): void {
    this.scrollContainer.nativeElement.scrollBy({
      left: 300,
      behavior: 'smooth',
    });
    setTimeout(() => this.checkScrollArrows(), 400);
  }

  checkScrollArrows(): void {
    const container = this.scrollContainer.nativeElement;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth - container.clientWidth;

    this.showLeftArrow = scrollLeft > 10;
    this.showRightArrow = scrollLeft < scrollWidth - 10;
  }
}
