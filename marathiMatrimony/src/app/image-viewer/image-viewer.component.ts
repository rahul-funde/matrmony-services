import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.css']
})
export class ImageViewerComponent implements OnChanges {

  @Input() images: any[] = [];
  @Input() apiUrl = '';
  @Input() open = false;

  @Output() close = new EventEmitter<void>();

  currentImageIndex = 0;
  zoomed = false;

  ngOnChanges() {
    if (this.open && this.images?.length) {
      const profileIndex = this.images.findIndex(i => i.isProfile === true);
      this.currentImageIndex = profileIndex >= 0 ? profileIndex : 0;
      this.zoomed = false;
    }
  }

  get currentImage(): string {
    return this.images?.[this.currentImageIndex]?.originalUrl || '';
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
    this.zoomed = false;
  }

  prevImage() {
    if (!this.images?.length) return;
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    this.zoomed = false;
  }

  nextImage() {
    if (!this.images?.length) return;
    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.images.length;
    this.zoomed = false;
  }

  toggleZoom() {
    this.zoomed = !this.zoomed;
  }

  onClose() {
    this.close.emit();
    this.zoomed = false;
  }
}
