import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingPageNewComponent } from './landing-page-new.component';

describe('LandingPageNewComponent', () => {
  let component: LandingPageNewComponent;
  let fixture: ComponentFixture<LandingPageNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingPageNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
