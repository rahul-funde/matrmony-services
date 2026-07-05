import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeUserplanComponent } from './upgrade-userplan.component';

describe('UpgradeUserplanComponent', () => {
  let component: UpgradeUserplanComponent;
  let fixture: ComponentFixture<UpgradeUserplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradeUserplanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpgradeUserplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
