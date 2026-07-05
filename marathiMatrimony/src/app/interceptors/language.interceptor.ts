import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const languageService = inject(LanguageService);

  return next(req.clone({
    setHeaders: {
      'Accept-Language': languageService.currentLanguage
    }
  }));
};
