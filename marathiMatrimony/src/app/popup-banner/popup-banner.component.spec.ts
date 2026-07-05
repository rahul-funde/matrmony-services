import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupBannerComponent } from './popup-banner.component';

describe('PopupBannerComponent', () => {
  let component: PopupBannerComponent;
  let fixture: ComponentFixture<PopupBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
