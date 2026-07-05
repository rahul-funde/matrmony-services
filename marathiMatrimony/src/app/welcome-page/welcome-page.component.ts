import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [],
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.css'] // fixed typo: styleUrl -> styleUrls
})
export class WelcomePageComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log("ngOnInit called");
    // Redirect to /welcome page on load
    this.router.navigate(['/login']);
  }

}

