import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { VerificationService, VerificationDocument } from '../services/verification-document.service';

@Component({
  selector: 'app-user-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-verification.component.html',
  styleUrls: ['./user-verification.component.css']
})
export class UserVerificationComponent implements OnInit {
  selectedFile: File | null = null;
  selectedDocType: string = '';
  uploadProgress: number = 0;
  documents: VerificationDocument[] = [];

  // Assume you get this userId from auth service / JWT
  userId: string = 'user::12345';  

  constructor(private verificationService: VerificationService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.selectedDocType) {
      alert('Please select a document type and file');
      return;
    }

    this.verificationService.uploadDocument(this.userId, this.selectedDocType, this.selectedFile)
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            alert('Document uploaded successfully');
            this.uploadProgress = 0;
            this.selectedFile = null;
            this.selectedDocType = '';
            this.loadDocuments();
          }
        },
        error: (err) => {
          console.error('Upload error', err);
          alert('Upload failed. Please try again.');
        }
      });
  }

  loadDocuments(): void {
    this.verificationService.getUserDocuments(this.userId).subscribe({
      next: (docs) => {
        this.documents = docs;
      },
      error: (err) => {
        console.error('Error fetching documents', err);
      }
    });
  }
}
