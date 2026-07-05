import { Component, OnInit } from '@angular/core';
import { SearchService } from '../services/search.service';
import { ProfileModel } from '../models/profile.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-saved-matches',
  imports: [CommonModule, FormsModule],
  templateUrl: './saved-matches.component.html',
  styleUrl: './saved-matches.component.css'
})
export class SavedMatchesComponent {
  savedProfiles: ProfileModel[] = [];

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    this.loadSaved();
  }

  loadSaved() {
    this.searchService.getSavedMatches().subscribe(data => {
      this.savedProfiles = data;
    });
  }

  clearAll() {
    this.searchService.clearSavedMatches();
    this.loadSaved();
  }
}
