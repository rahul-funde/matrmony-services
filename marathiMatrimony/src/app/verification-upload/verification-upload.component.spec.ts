import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationUploadComponent } from './verification-upload.component';

describe('VerificationUploadComponent', () => {
  let component: VerificationUploadComponent;
  let fixture: ComponentFixture<VerificationUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificationUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
