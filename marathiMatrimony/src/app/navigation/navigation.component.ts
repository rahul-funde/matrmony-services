import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material.module';
import { MatSidenav } from '@angular/material/sidenav';
import { Subscription } from 'rxjs';
import { SidenavMenuItem, SidenavMenuService } from '../services/sidenav-menu.service';
import { SidenavService } from '../services/sidenav.service';
import { HomeContainerComponent } from "../home-container/home-container.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [MaterialModule, RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  private toggleSubscription!: Subscription;
  menuItems: SidenavMenuItem[] = [];

  constructor(
    private sidenavService: SidenavService,
    private sidenavMenuService: SidenavMenuService
  ) {}

  ngOnInit() {
    this.menuItems = this.sidenavMenuService.getMenuItems();
  }

  ngAfterViewInit() {
    console.log('NavigationComponent: View initialized');

    this.toggleSubscription = this.sidenavService.toggle$.subscribe(() => {
      if (this.sidenav) {
        this.sidenav.toggle();
        console.log('NavigationComponent: sidenav.toggle() executed');
      } else {
        console.warn('NavigationComponent: sidenav is undefined!');
      }
    });
  }

  ngOnDestroy() {
    if (this.toggleSubscription) {
      this.toggleSubscription.unsubscribe();
      console.log('NavigationComponent: toggleSubscription unsubscribed');
    }
  }
}
