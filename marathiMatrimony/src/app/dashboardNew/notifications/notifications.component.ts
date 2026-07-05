import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardDataService } from '../service/dashboard-data.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class NotificationsComponent implements OnInit {
  notifications$!: Observable<any[]>;
  constructor(private dataService: DashboardDataService) {}
  ngOnInit() { this.notifications$ = this.dataService.getNotifications(); }
}
