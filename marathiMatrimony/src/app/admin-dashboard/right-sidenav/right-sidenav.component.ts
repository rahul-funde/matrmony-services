import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-right-sidenav',
  imports: [MaterialModule],
  templateUrl: './right-sidenav.component.html',
  styleUrl: './right-sidenav.component.css'
})
export class RightSidenavComponent {
  @Output() close = new EventEmitter<void>();

  closeSidenav() {
    this.close.emit();
  }
}
