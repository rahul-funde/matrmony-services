import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialModule } from '../material.module';
import { SidenavMenuService } from '../services/sidenav-menu.service';
import { Observable, take } from 'rxjs';
import { SidenavMenuItem } from '../services/sidenav-menu.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {

  // ⛔ DO NOT use static:true here
  @ViewChild('sidenavRef', { static: false })
  sidenavRef?: ElementRef<HTMLElement>;

  // ===== Streams =====
  isOpen$!: Observable<boolean>;
  isCollapsed$!: Observable<boolean>;
  menuItems$!: Observable<SidenavMenuItem[]>;

  // ===== UI State =====
  isMobile = window.innerWidth <= 768;
  isRouteChanging = false;

  constructor(
    private menuService: SidenavMenuService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.isOpen$ = this.menuService.isOpen$;
    this.isCollapsed$ = this.menuService.isCollapsed$;
    this.menuItems$ = this.menuService.menuItems$;

    // Route animation
    this.router.events.subscribe(() => {
      this.isRouteChanging = true;
      setTimeout(() => (this.isRouteChanging = false), 250);
    });
  }

  // ===============================
  // CLICK OUTSIDE HANDLER ✅ SAFE
  // ===============================
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent): void {

    // 🔐 Guard — view not ready
    if (!this.sidenavRef?.nativeElement) return;

    const clickedInside =
      this.sidenavRef.nativeElement.contains(event.target as Node);

    if (clickedInside) return;

    if (this.isMobile) {
      // 📱 Mobile → close
      this.menuService.close();
    } else {
      // 🖥 Desktop → collapse ONLY if expanded
      this.isCollapsed$
        .pipe(take(1))
        .subscribe(isCollapsed => {
          if (!isCollapsed) {
            this.menuService.toggleCollapse();
          }
        });
    }
  }

  // ===============================
  // ACTIONS
  // ===============================
  close(): void {
    if (this.isMobile) {
      this.menuService.close();
    }
  }

  toggleCollapse(): void {
    if (!this.isMobile) {
      this.menuService.toggleCollapse();
    }
  }

  // ❗ NO AUTO-EXPAND ON HOVER (desktop)
  onHover(expand: boolean): void {
    // intentionally empty
    // tooltip only when collapsed
  }

  // ESC closes on mobile
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.isMobile) {
      this.menuService.close();
    }
  }

  // Resize handler
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 768;
  }
}
