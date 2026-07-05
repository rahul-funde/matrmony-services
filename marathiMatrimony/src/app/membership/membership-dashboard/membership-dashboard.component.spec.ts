import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembershipDashboardComponent } from './membership-dashboard.component';

describe('MembershipDashboardComponent', () => {
  let component: MembershipDashboardComponent;
  let fixture: ComponentFixture<MembershipDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembershipDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembershipDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
