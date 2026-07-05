import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';


interface Profile {
  id: number;
  name: string;
  age: number;
  location: string;
  hasPhoto: boolean;
  created_at: Date;
}


@Component({
  selector: 'app-search-matches',
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './search-matches.component.html',
  styleUrl: './search-matches.component.css'
})
export class SearchMatchesComponent {
  results: Profile[] = [];
  filteredResults: Profile[] = [];
  savedMatches: Profile[] = [];
  selectedProfile: Profile | null = null;

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  ageMin: number = 18;
  ageMax: number = 40;
  location: string = '';
  photoOnly: boolean = false;
  sortBy: string = 'relevance';

  ngOnInit() {
    this.fetchResults();
  }

  fetchResults() {
    this.results = Array(30).fill(0).map((_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      age: 18 + (i % 20),
      location: 'Atlanta, GA',
      hasPhoto: i % 2 === 0,
      created_at: new Date(Date.now() - i * 1000000)
    }));
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResults = this.results.filter(p =>
      p.age >= this.ageMin &&
      p.age <= this.ageMax &&
      (!this.photoOnly || p.hasPhoto) &&
      (this.location ? p.location.toLowerCase().includes(this.location.toLowerCase()) : true)
    );
    this.applySorting();
  }

  applySorting() {
    const sort = this.sortBy;
    if (sort === 'age-asc') {
      this.filteredResults.sort((a, b) => a.age - b.age);
    } else if (sort === 'age-desc') {
      this.filteredResults.sort((a, b) => b.age - a.age);
    } else if (sort === 'recent') {
      this.filteredResults.sort((a, b) => +b.created_at - +a.created_at);
    }
    this.totalPages = Math.ceil(this.filteredResults.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  get paginatedResults() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredResults.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openQuickView(profile: Profile) {
    this.selectedProfile = profile;
  }

  closeQuickView() {
    this.selectedProfile = null;
  }

  saveMatch(profile: Profile) {
    if (!this.savedMatches.find(p => p.id === profile.id)) {
      this.savedMatches.push(profile);
    }
  }

  removeSavedMatch(profile: Profile) {
    this.savedMatches = this.savedMatches.filter(p => p.id !== profile.id);
  }
}
