import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-chat',
  template: `<button mat-fab class="fab"><mat-icon>chat</mat-icon></button>`,
  styles: [`.fab{position:fixed;right:20px;bottom:24px;background:var(--sky-500);color:#fff}`],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class FloatingChatComponent {}
