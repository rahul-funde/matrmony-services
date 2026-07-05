import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';
import { PrimaryButtonComponent } from './shared/primary-button/primary-button.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, FormsModule, TranslatePipe, PrimaryButtonComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Matrisite';

  constructor(
    public languageService: LanguageService,
    public themeService: ThemeService
  ) {}

  changeLanguage(languageCode: string): void {
    this.languageService.useLanguage(languageCode);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
