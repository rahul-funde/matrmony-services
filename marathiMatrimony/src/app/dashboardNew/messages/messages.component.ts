import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardDataService } from '../service/dashboard-data.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(5px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MessagesComponent implements OnInit {
  messages$!: Observable<any[]>;
  constructor(private dataService: DashboardDataService) {}
  ngOnInit() { this.messages$ = this.dataService.getMessages(); }
}
