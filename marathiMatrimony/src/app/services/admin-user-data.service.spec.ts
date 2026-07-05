import { TestBed } from '@angular/core/testing';

import { AdminUserDataService } from './admin-user-data.service';

describe('AdminUserDataService', () => {
  let service: AdminUserDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminUserDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
