import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatchService, Match } from '../services-blue/match.service';

@Component({
  selector: 'app-match-suggestions',
  templateUrl: './match-suggestions.component.html',
  styleUrls: ['./match-suggestions.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, FormsModule],
  providers: [MatchService]
})
export class MatchSuggestionsComponent implements OnInit {
  matches: Match[] = [];
  loading = true;
  constructor(private ms: MatchService) {}
  ngOnInit(){ this.ms.getSuggestedMatches().subscribe(m => { this.matches = m; this.loading = false; }); }
  shortlist(m:Match){ console.log('shortlist', m); }
  sendInterest(m:Match){ console.log('interest', m); }
}
