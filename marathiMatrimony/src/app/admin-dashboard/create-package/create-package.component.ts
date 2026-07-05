import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-create-package',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-package.component.html',
  styleUrl: './create-package.component.css'
})
export class CreatePackageComponent {
  
  packageForm: FormGroup;
  message: string = '';
  error: string = '';
  apiUrl = environment.apiUrl;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.packageForm = this.fb.group({
      name: ['', Validators.required],
      price: [null, Validators.required],
      duration: ['', Validators.required],
      features: ['', Validators.required],
      badgeColor: ['', Validators.required]
    });
  }

  submitForm() {
    if (this.packageForm.invalid) return;

    const data = {
      ...this.packageForm.value,
      features: this.packageForm.value.features.split(',').map((f: string) => f.trim())
    };

    this.http.post(`${this.apiUrl}/api/package/createPackage`, data).subscribe({
      next: (res: any) => {
        this.message = res.message;
        this.error = '';
        this.packageForm.reset();
      },
      error: err => {
        this.error = err.error.message || 'Something went wrong';
        this.message = '';
      }
    });
  }
}
