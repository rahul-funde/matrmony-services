import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';


@Component({
  selector: 'app-carousel',
  imports: [CarouselModule, CommonModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent {
 
  slides = [
  { id: '1', image: '/images/banner-1.jpg', title: 'Slide 1' },
  { id: '2', image: '/images/banner-ad-1.jpg', title: 'Slide 2' },
  { id: '3', image: '/images/banner-ad-2.jpg', title: 'Slide 3' },
  { id: '4', image: '/images/banner-newsletter.jpg', title: 'Slide 4' }
  ];


// customOptions: OwlOptions = {
//   loop: true,
//   margin: 10,
//   nav: true,
//   dots: true,
//   autoplay: true,
//   autoplayTimeout: 3000,
//   autoplayHoverPause: true,
//   responsive: {
//     0: { items: 1 },
//     600: { items: 1 },
//     1000: { items: 1 }
//   }
// };

customOptions: OwlOptions = {
  loop: true,
  margin: 10,
  nav: true,
  dots: true,
  autoplay: true,
  autoplayTimeout: 3000,
  autoplayHoverPause: true,
  responsive: {
    0: { items: 1 },
    600: { items: 1 },
    1000: { items: 1 }
  }
};

}
