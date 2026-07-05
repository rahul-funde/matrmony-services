import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { usersProfileResolver } from './users-profile.resolver';

describe('usersProfileResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => usersProfileResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
