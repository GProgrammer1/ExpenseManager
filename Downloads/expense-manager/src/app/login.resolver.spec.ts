import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { loginResolver } from './login.resolver';

describe('loginResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => loginResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
