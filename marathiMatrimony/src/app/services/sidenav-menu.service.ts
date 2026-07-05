import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

/* ================= MENU MODEL ================= */
export interface SidenavMenuItem {
  icon: string;
  label: string;
  link: string;
  requiresPremium?: boolean;
  roles?: string[];
  section?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SidenavMenuService {

  /* ---------- SIDENAV OPEN / CLOSE ---------- */
  private openSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.openSubject.asObservable();

  toggleOpen() {
    this.openSubject.next(!this.openSubject.value);
  }

  close() {
    this.openSubject.next(false);
  }

  open() {
    this.openSubject.next(true);
  }

  /* ---------- COLLAPSE STATE ---------- */
  private collapsedSubject = new BehaviorSubject<boolean>(false);
  isCollapsed$ = this.collapsedSubject.asObservable();

  toggleCollapse() {
    this.collapsedSubject.next(!this.collapsedSubject.value);
  }

  /* ---------- USER STATE ---------- */
  private roleSubject = new BehaviorSubject<string>('user');
  private premiumSubject = new BehaviorSubject<boolean>(false);

  setUser(role: string, isPremium: boolean) {
    this.roleSubject.next(role);
    this.premiumSubject.next(isPremium);
  }

  /* ---------- MENU ITEMS ---------- */
  private menuItems: SidenavMenuItem[] = [
    { icon: 'home', label: 'मुख्यपृष्ठ', link: '/dashboard' },
    { icon: 'person', label: 'प्रोफाइल', link: '/user-profile' },
    { icon: 'search', label: 'शोध व जुळवणी', link: '/search-profile' },
    {
      icon: 'star',
      label: 'रस / इंटरेस्ट',
      link: '/interests',
      // requiresPremium: true
    }
  ];

  /* ---------- FILTERED MENU (REACTIVE) ---------- */
  menuItems$ = combineLatest([
    this.roleSubject,
    this.premiumSubject
  ]).pipe(
    map(([role, isPremium]) =>
      this.menuItems.filter(item => {
        if (item.requiresPremium && !isPremium) return false;
        if (item.roles && !item.roles.includes(role)) return false;
        return true;
      })
    )
  );

  collapseFromMain(): void {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) return;

    if (!this.collapsedSubject.value) {
      this.toggleCollapse();
    }
  }

}
