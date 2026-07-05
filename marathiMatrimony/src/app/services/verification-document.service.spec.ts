import { TestBed } from '@angular/core/testing';

import { VerificationDocumentService } from './verification-document.service';

describe('VerificationDocumentService', () => {
  let service: VerificationDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VerificationDocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
