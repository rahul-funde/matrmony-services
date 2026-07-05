import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'preferredTheme';
const DEFAULT_THEME: AppTheme = 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly currentThemeSubject = new BehaviorSubject<AppTheme>(DEFAULT_THEME);
  readonly currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.useTheme(this.resolveInitialTheme());
  }

  get currentTheme(): AppTheme {
    return this.currentThemeSubject.value;
  }

  toggleTheme(): void {
    this.useTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
  }

  useTheme(theme: AppTheme): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.currentThemeSubject.next(theme);

    if (this.isBrowser()) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }

  private resolveInitialTheme(): AppTheme {
    if (!this.isBrowser()) {
      return DEFAULT_THEME;
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : DEFAULT_THEME;
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
