import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdminUserDataService } from '../../services/admin-user-data.service';

@Component({
  selector: 'app-update-password-dialog',
  templateUrl: './update-password-dialog.component.html',
  styleUrls: ['./update-password-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class UpdatePasswordDialogComponent {

  password = '';
  confirmPassword = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<UpdatePasswordDialogComponent>,
    private dataService: AdminUserDataService
  ) {}

  submit() {
    if (!this.password || this.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.dataService.updateUserPassword(
      this.data.userId,
      this.password
    ).subscribe({
      next: () => {
        alert('Password updated successfully');
        this.dialogRef.close(true);
      },
      error: err => {
        alert(err.error?.message || 'Failed to update password');
      }
    });
  }
}
