import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialmediaShareComponent } from './socialmedia-share.component';

describe('SocialmediaShareComponent', () => {
  let component: SocialmediaShareComponent;
  let fixture: ComponentFixture<SocialmediaShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialmediaShareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocialmediaShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
