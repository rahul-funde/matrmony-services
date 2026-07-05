import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export interface SupportedLanguage {
  code: string;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
];

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';
const DEFAULT_LANGUAGE = 'mr';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly languages = SUPPORTED_LANGUAGES;
  private readonly currentLanguageSubject = new BehaviorSubject<string>(DEFAULT_LANGUAGE);
  readonly currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    const codes = this.languages.map(language => language.code);
    this.translate.addLangs(codes);
    this.translate.setFallbackLang(DEFAULT_LANGUAGE);

    const initialLanguage = this.resolveInitialLanguage();
    this.useLanguage(initialLanguage);
  }

  get currentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  useLanguage(languageCode: string): void {
    const language = this.isSupported(languageCode) ? languageCode : DEFAULT_LANGUAGE;

    this.translate.use(language);
    this.currentLanguageSubject.next(language);

    if (this.isBrowser()) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language;
    }
  }

  private resolveInitialLanguage(): string {
    if (!this.isBrowser()) {
      return DEFAULT_LANGUAGE;
    }

    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && this.isSupported(savedLanguage)) {
      return savedLanguage;
    }

    const browserLanguage = navigator.language.split('-')[0];
    return this.isSupported(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE;
  }

  private isSupported(languageCode: string): boolean {
    return this.languages.some(language => language.code === languageCode);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
