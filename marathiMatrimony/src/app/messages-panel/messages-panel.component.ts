import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MessageService } from '../services-blue/message.service';

@Component({
  selector: 'app-messages-panel',
  templateUrl: './messages-panel.component.html',
  styleUrls: ['./messages-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTabsModule, MatButtonModule],
  providers: [MessageService]
})
export class MessagesPanelComponent implements OnInit {
  received:any[] = []; sent:any[] = [];
  constructor(private ms: MessageService) {}
  ngOnInit(){ this.ms.getReceived().subscribe(r => this.received = r); this.ms.getSent().subscribe(s => this.sent = s); }
}
