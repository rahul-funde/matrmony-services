import { TestBed } from '@angular/core/testing';

import { ProfilePdfService } from './profile-pdf.service';

describe('ProfilePdfService', () => {
  let service: ProfilePdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfilePdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
