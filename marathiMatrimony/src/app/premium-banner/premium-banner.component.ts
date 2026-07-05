import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-banner',
  template: `<mat-card class="premium"><h4>Upgrade to Premium</h4><p>Get more visibility and priority placement.</p><button mat-raised-button color="primary">Upgrade</button></mat-card>`,
  styles: [`.premium{padding:1rem;border-radius:12px;background:linear-gradient(90deg,var(--sky-200),#a5f3fc)}`],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule]
})
export class PremiumBannerComponent {}
