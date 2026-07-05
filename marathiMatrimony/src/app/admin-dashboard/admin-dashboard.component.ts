import { Component } from '@angular/core';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopNavComponent } from './top-nav/top-nav.component';
import { MainContentComponent } from './main-content/main-content.component';
import { MaterialModule } from '../material.module';
@Component({
  selector: 'app-admin-dashboard',
  imports: [SidebarComponent,TopNavComponent,MainContentComponent,MaterialModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  isSidenavOpen = false;

  onSidenavToggle(opened: boolean) {
    this.isSidenavOpen = opened;
  }
  
}
